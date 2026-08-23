# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current status record, owner-decision ledger, implementation-debt ledger, deployment checkpoint, and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single canonical production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems, or a second master plan.

# CURRENT STATUS — 2026-08-23

## Canonical production line
- `main` is the one canonical production implementation line and is coupled to Vercel production.
- Applied database migrations are immutable; corrections use later additive migrations.
- Never create paid Supabase branches or other paid infrastructure.
- PR #47 is merged/closed historical recovery work. PR #49 and #50 are merged production history.

## Catalog identity confidence — LIVE PRODUCTION
- PR #49 merged to `main` as `0b569e4a25b7f75a313e57ca94d79286ec3df1df` after LikeSized CI run #593 passed end-to-end.
- Production includes intake-method-independent manual/barcode Product corroboration, five-member automatic Corroborated Product promotion, separate Product-to-barcode confidence, conflict gates, and safe Corroborated-candidate size-system defaults.
- Production Supabase migration `20260823054933 generalize_catalog_identity_confidence` is applied from canonical local `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`.
- PR #50 reconciled production-status canon to `main` as `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- Distinct-second-member production check is complete: Maidenform / Heirloom / bra candidate `de34b6dd-47c9-4795-af77-5117e4f8b554` reached **Corroborated** with 2 distinct confirming members, 0 identity conflicts, and 2 distinct-member barcode confirmations for UPC `196988323504`. It correctly remains unresolved/non-canonical because automatic Product promotion requires 5 distinct confirming members.

## Active New Fit Report + Sleepwear + Fit Community line — IMPLEMENTED, PRODUCTION AUTHORIZED, DEPLOYMENT PENDING
- `agent/fit-report-review-purchase-context` is the one active branch, created from canonical `main` at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`; PR #51 is its controlled merge path.
- Owner visually sanity-checked the category-first / optional-information / final-review direction and explicitly authorized locking the completed changes and pushing them live for real Fit Report testing.
- The branch now includes canonical purchase-context persistence rather than collecting and discarding optional answers.
- The branch adds the owner-approved **Sleepwear & Lingerie** category and controlled questions.
- The branch changes signed-in `/` to My Circle and adds the approved public FAQ comparison/differentiation entry.
- The branch adds the owner-approved **Fit Community** preference — Men / Women / Both — as a wearer/member relevance default without changing body Match math.
- Production deployment is not recorded as complete until PR #51 is merged, all three new ordered Supabase migrations are applied, Vercel is READY on the merged `main`, and production smoke checks pass.

Pending local migrations on this authorized line:
- `20260823130000_add_sleepwear_lingerie_category.sql`
- `20260823130100_purchase_context_and_sleepwear_taxonomy.sql`
- `20260823140000_add_fit_community_preference.sql`

# CANONICAL RECOVERY / LINEAGE STATUS
The 2026-08-21 CANONICAL RECOVERY is complete. Current work is normal owner-approved development against the one `main` production line; no recovery freeze is active.

## Current production Supabase checkpoint
Production project: `rlksidwniuoxoacumyaf`.

Latest applied production tail before PR #51 deployment:
- `20260823054933 generalize_catalog_identity_confidence` — local `20260823040000_generalize_catalog_identity_confidence.sql`
- `20260823031701 require_two_confirmed_barcode_submitters`
- `20260823031508 barcode_confirmation_corroboration`
- `20260823023807 one_shot_matched_product_notifications`
- `20260823015741 default_following_notifications_off`
- `20260823015601 explicit_following_notification_opt_in`
- `20260823010127 add_member_profile_photo_storage`
- `20260822231014 restore_state_based_body_report_identity`
- `20260822230502 compare_body_change_to_latest_report` — historical applied experiment, superseded by restore
- `20260822225515 roll_fit_report_body_identity_baseline`
- `20260822224350 fix_body_identity_conflict_target`
- `20260822223342 garment_relevant_body_report_identity`
- `20260822210009 count_all_distinct_fit_situations`
- `20260822205854 consensus_material_defaults_and_identity_flags`
- `20260822203208 accept_report_scoped_attribute_variants`
- `20260822203048 harden_report_scoped_evidence_writer`
- `20260822202955 fit_report_variant_deduplication`

Supabase-assigned production timestamps may differ from local canonical migration filenames. Never rename an applied local migration to chase generated production timestamps.

# OWNER RE-AUDIT WORKFLOW — LOCKED
The site underwent a major rework. Except for surfaces explicitly owner-confirmed below, old approvals do not automatically carry forward.

For each surface:
1. inspect current/live source and relevant DB behavior;
2. identify issues before unrelated changes;
3. owner locks behavior;
4. make the change in the canonical owning source;
5. verify production behavior;
6. owner explicitly confirms the surface;
7. update this master.

One issue/decision at a time during interactive owner testing.

# OWNER-CONFIRMED / CURRENT AUDIT STATUS

## Homepage + FAQ — APPROVED CHANGE ON PR #51, PRODUCTION VERIFICATION PENDING
- Logged-out `/` remains the public LikeSized informational homepage.
- Logged-in `/` must open **My Circle** at `/circle`, not a separate Following/Outfit-feed home.
- `/following` is obsolete compatibility routing and resolves to `/circle`.
- Do not create a second signed-in homepage implementation. My Circle may later gain a small useful home-style module only during the My Circle audit.
- Public FAQ adds **What makes LikeSized different from other sizing and fashion tools?** without unverifiable competitor claims.
- FAQ explains that LikeSized starts with real Fit Reports from people built like the viewer, uses garment-relevant matching, and tracks evidence down to the individual Product/item when reports exist because two items from the same brand/printed size can fit differently. Exact body measurements remain private.

## Global header / member Menu / admin navigation — NEEDS FINAL RE-CONFIRMATION
Grouped menu was owner-approved visually. Sign Out was later fixed and `Settings` renamed to `Profile Settings`; complete menu surface still needs final re-confirmation.

## Auth — OWNER CONFIRMED
Signup/Login/Forgot Password/Reset Password recovery behavior is audited and owner-confirmed: **Auth is good.**

## Fit Profile — BASE OWNER CONFIRMED; FIT COMMUNITY ADDITION APPROVED ON PR #51, LIVE VERIFICATION PENDING
Owner confirmed the re-audited Fit Profile base: **All good.** Preferred Fit UI remains retired. PR #51 adds required first-setup Fit Community selection and editable current preference without adding Fit Community to Match math.

## Settings — BASE OWNER CONFIRMED; FIT COMMUNITY EDITING APPROVED ON PR #51, LIVE VERIFICATION PENDING
Identity/profile-photo/privacy/notification-setting work was deployed and owner moved on with **Ok Next**. PR #51 adds owner-controlled Fit Community editing under Profile Settings.

## Notifications — ACTIVE AUDIT, NOT YET OWNER-CONFIRMED COMPLETE
Approved structure includes:
- `NOTIFICATIONS` / `What’s new for you.` / `Updates from people you follow and products you’re watching.`
- Style Feed, Notification settings, and Mark all read where applicable;
- `PRODUCT UPDATES`;
- `FOLLOWING ACTIVITY` / `Updates from people you follow`;
- person profile photos/initials, Match context, relevant activity copy/actions;
- `NO NOTIFICATIONS YET` / `Nothing new yet.` empty state;
- Settings notification anchor `/settings#notifications`.

Notifications remains the next unfinished audit after the authorized New Fit Report deployment/owner live test.

## New Fit Report — OWNER-APPROVED PR #51 LINE, PRODUCTION DEPLOYMENT PENDING
The prior generalized confidence/scanner foundation is already live. PR #51 adds the final owner-approved intake changes below.

Main form order:
1. Brand / Make.
2. Item / Model.
3. **Overall category**.
4. **Specific garment type**, filtered to only the selected category.
5. optional Department.
6. zero-to-four controlled item-detail questions; **Not sure** is always the final choice and records no positive physical claim.
7. Color.
8. Size.
9. Overall Fit Result.
10. Condition.
11. optional Fit Photo.
12. optional Fit Notes.
13. optional Retail Link.

Retail Link stays in the main flow because it is reusable Product/retailer evidence.

### Optional Additional Information — OWNER LOCKED
Collapsed by default, exact order:
1. **Purchased From** — free-form with typeahead suggestions from retailers already known to LikeSized.
2. **Price Paid** — numeric-only, non-negative, normal currency decimals.
3. **Purchase Method** — Online / In Store / Received as a Gift.
4. **Approx. Purchase Date** — fixed Month + Year selections.
5. UPC / barcode if not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo.

If scanner already captured a barcode, retain it as evidence and do not ask for it again. Submit remains below/outside the collapsed optional section. The excessive blank space at the top of the expanded optional section is removed.

### Purchase-context persistence — OWNER LOCKED
`Purchased From`, `Price Paid`, `Purchase Method`, and `Approx. Purchase Date` are one member's acquisition observation for that counted Fit Report; they are never Product truth.

- every new member/entry begins blank;
- no value is inherited merely because the Product matches;
- `fit_report_purchase_context.fit_report_id` is the one-observation key, so repeated compatible-report processing cannot manufacture duplicate acquisition observations;
- completely blank purchase context creates no row;
- free-form retailer text is preserved and may link only to an already-known retailer by normalized exact match; it does not create a new retailer or Product retailer listing;
- Price Paid is validated server/database-side as fixed numeric;
- Purchase Method is controlled;
- Month and Year must be a valid pair; no exact day is invented;
- direct purchase-context rows are owner-scoped by RLS;
- purchase context never changes Product identity/confidence, Match, recommendation rank, or Shop retailer truth.

### Final confirmation — OWNER LOCKED
Before server submission, valid form data opens **Does this look right?**. It shows only the main/top Fit Report information and intentionally excludes every Optional Additional Information field.

It may show Brand/Item, Overall category, Specific garment type, Department, item-detail answers, Color, Size, Overall Fit Result, Condition, Fit Photo added-state, Fit Notes, and Retail Link.

Actions are **Go Back & Edit** and **Confirm Fit Report**. Nothing is submitted until confirmation.

# SLEEPWEAR & LINGERIE — OWNER LOCKED
Top-level category: **Sleepwear & Lingerie**.

Keep **Sweatpants** under Bottoms. Keep Bra, Bralette, Sports Bra, Underwear, and Shapewear under Intimates. **Sleep Shirt is intentionally not included.**

Controlled types/questions; every question also gets the automatic final **Not sure** choice:
- **Pajama pants:** Intended fit Fitted / Regular / Relaxed; Rise Low / Mid / High; Length Cropped / Ankle / Full / Long; Waistband Elastic / Drawstring / Button / fly.
- **Pajama shorts:** Intended fit Fitted / Regular / Relaxed; Rise Low / Mid / High; Length Short / Mid / Long; Waistband Elastic / Drawstring / Button / fly.
- **Pajama set:** Bottom style Pants / Shorts; Top sleeve Sleeveless / Short / Long; Intended fit Fitted / Regular / Relaxed; Top closure Pullover / Button / Zip. Use the printed set size; do not invent separate top/bottom sizes unless genuinely separate Products.
- **Nightgown:** Shape Fitted / Regular / Flowy; Length Mini / Knee / Midi / Maxi; Top / sleeve Spaghetti strap / Sleeveless / Short / Long; Bust support None / Light / Structured.
- **Robe:** Intended fit Regular / Relaxed / Oversized; Length Short / Knee / Midi / Long; Sleeve Short / 3/4 / Long; Closure Tie / Button / Zip / Open Front.
- **Chemise:** Shape Fitted / Regular / Flowy; Length Mini / Knee; Top / strap Spaghetti strap / Halter / Sleeveless / Short sleeve; Bust support None / Light / Structured.
- **Babydoll:** Bust support None / Light / Structured; Underbust fit Loose / Elastic / Fitted; Length Mini / Knee; Top / strap Spaghetti strap / Halter / Sleeveless / Short sleeve.
- **Teddy:** Top / sleeve Strapless / Halter / Sleeveless / Short / Long; Neckline High / Low; Bottom coverage Thong / Brief / Full; Closure Pull-on / Snap / Hook.
- **Corset & bustier:** Style Corset / Bustier / Longline bustier; Structure Soft / Boned; Closure Lace-up / Hook & eye / Front busk / Zip; Length Waist / Hip / Longline.
- **Costume lingerie:** Garment form One-piece / Two-piece set / Multi-piece set; Top style Bra / Bralette / Corset or bustier / Cami or top / Halter / Dress-style / No separate top; Bottom style Thong / Brief / Shorts / Skirt / Garter-style / No separate bottom; Structure / Support Soft / Stretchy / Light Support / Structured / Boned. Closure is deliberately not one of the four Costume Lingerie questions because Structure / Support is more fit-relevant.

# PRODUCT IDENTITY / BARCODE CONFIDENCE — OWNER LOCKED

## Product identity is intake-method independent
Product identity is normalized shared garment identity centered on Brand + Item + Garment Type. Manual, barcode-assisted, and mixed submissions support the same candidate.

Thresholds:
- **1 distinct member → Provisional.**
- **2 distinct members → Corroborated.**
- **5 distinct confirming members → eligible for automatic canonical Product promotion** when blocking ambiguity is absent.
- automatic promotion creates/maps a **Corroborated** Product, never Verified.
- **Verified** requires authoritative/admin-reviewed evidence and is not a member-vote threshold.
- repeated reports from one member do not create extra Product-identity confirmations.

Corroborated and Verified Products use the same ordinary safe member flow; Verified differs in backend authority/precedence. A uniquely matched unresolved Corroborated candidate may provide narrow safe defaults without becoming an ordinary Product/search result.

## Identity conflicts
- conflicts do not erase confirmations/history;
- 5 confirmations / 1 genuine identity conflict may still auto-promote while retaining review visibility;
- 2+ independent identity conflicts block automatic promotion at Corroborated + Needs Review;
- conflicts >= confirmations are Needs Review;
- Size, Color, legitimate alternate barcode, retailer link, Fit Result, Material, and report-scoped physical answers are not identity conflicts by themselves;
- an already-promoted Product stays usable when later conflict evidence appears until audited resolution changes it.

## Barcode relationship
Barcode confidence is separate from Product confidence.
- first distinct member associating a new barcode to a known Product creates provisional Product→barcode evidence;
- second distinct member with corresponding Product Fit Report evidence corroborates that relationship;
- one Product may have multiple legitimate independently learned barcodes;
- a new retailer/package barcode does not create a duplicate Product;
- one barcode accumulating credible evidence toward competing Products is flagged and never silently reassigned.

## Scanner flow
- ordinary UPC/EAN 1-D barcode scanning; QR not required;
- canonical identifiers, then unique provisional Product→barcode evidence, then unresolved candidate evidence;
- unique match pauses at **Is this the item?**;
- confirmation card shows only safe Product photo if available, Brand, Item, Category/Type, **Yes — this is the item**, **No — enter manually**;
- normal physical garment questions stay in the Fit Report, not the identity card;
- Yes on Product continues known-Product flow; Yes on candidate prefills safe pending identity; No/unknown continues manual while retaining barcode evidence;
- ambiguous barcode identities are never auto-selected;
- never use another member's Fit Photo as generic Product imagery.

Known owner test artifact:
- candidate `de34b6dd-47c9-4795-af77-5117e4f8b554` — Maidenform / Heirloom / bra;
- UPC `196988323504`;
- live second-account test complete at 2 distinct confirmations / Corroborated / 0 conflicts.

Do not remove user/test history blindly.

# OWNER-LOCKED FIT REPORT RULES

## Counted identity
For a resolved Product, one counted Fit Report represents a distinct state for Member + exact Product + normalized Size + objective physical garment-answer fingerprint + garment-relevant body state.

Fit Result, Intended Fit, Condition, Color, material, retail link, identifier, Department, notes, Product Photo, Fit Photo, and purchase context do not independently create another counted report.

Size changes create distinct reports. Genuine objective physical controlled-answer changes can create distinct reports. `Not sure` is stored but excluded from positive physical identity; Intended Fit is report/filter metadata and excluded from objective physical identity.

## Garment-relevant body state
Use the same canonical Product measurement map as Fit Match: `private.product_match_measurements(product_id)`.
- irrelevant measurement changes never split a report;
- blank→filled relevant measurements enrich a compatible report;
- value→blank does not create a report or erase established evidence;
- `abs(new-old)/abs(old) < 0.02` is compatible; `>= 0.02` is materially different for that established relevant measurement;
- direction is symmetric;
- accepted under-2% values become the rolling active baseline;
- returning to an already represented body state reuses that compatible historical state;
- original `fit_profile_version_id` stays immutable while `match_fit_profile_version_id`/private baseline may advance.

One member may have multiple legitimate counted reports when Size, objective physical variant, or garment-relevant body state is genuinely distinct. Evidence counting and unique-wearer presentation are separate.

There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big and is not a star score.

## Post-submit mutation direction — CLOSET AUDIT REQUIRED
The owner is leaning toward immutable original confirmed Fit Report evidence rather than unrestricted rewriting. Closet must classify each field as:
- immutable historical evidence;
- add-missing-only enrichment;
- narrowly correctable with preserved history where justified;
- later dated lifecycle observations.

Kept / Returned / Exchanged and changes after use such as shrinkage belong to later Closet lifecycle observations rather than silent rewrites of the original try-on submission. Do not implement unrestricted Edit Item behavior before the Closet audit settles this contract.

# CLOSET / MEMBER CLOSET — OWNER LOCKED PUBLIC MODEL
- One canonical Closet, not separate My Closet and Shared Closet implementations.
- Every member garment and Fit Report is intended public member-facing content all the time; no product-level Private / Shared garment mode.
- Self-view shows the same public content plus owner-only management controls; other-member view shows the same content without those controls.
- Reuse one canonical garment-card/Fit Report foundation across Closet, member profile, People My Size, My Circle, Style Feed, Product discovery, and applicable shopping surfaces.
- Raw current/historical body measurements and private matching baselines remain protected; only derived Match/context is exposed.
- Existing `closet_items.visibility` / private-shared RLS/UI is legacy implementation debt to remove/neutralize during the Closet foundation audit.
- Settle immutable/add-missing/correction/lifecycle mutation behavior before broad owner edit controls.

# FIT COMMUNITY / PERSONALIZED RELEVANCE — OWNER LOCKED
- Fit Profile has one current owner-private **Fit Community** preference: **Men / Women / Both**.
- Fit Community is a personalization/community relevance field. It is **not** biological-sex truth, public gender identity, garment Department, Product identity, or a body measurement.
- **Body Match answers how similarly two people are built. Fit Community answers which wearer/member community should normally populate the personalized experience.** Fit Community never changes the numeric Match calculation.
- Men defaults People My Size, Fit Twin suggestions, and My Circle/social relevance to Men-compatible wearers; Women does the same for Women-compatible wearers; Both permits all communities.
- A member choosing Both is compatible with Men and Women views so legacy members and cross-community members are not silently discarded.
- Personalized social filtering is by the **wearer/posting member's Fit Community**, not by the Department assigned to the garment. A Women-community member who wears/reviews Men's 30×30 jeans remains Women-community content and can be useful to other Women-community members.
- Garment Department remains Product/Fit Report context. Intentional Product browsing/detail pages must not discard otherwise useful Fit Reports merely because the garment Department differs from the wearer's Fit Community.
- Men / Women / Both view controls may temporarily override the saved preference without changing it. Only an explicit Fit Profile/Profile Settings save changes the stored default.
- PR #51 implements the saved preference plus People My Size and My Circle view overrides. Search/Explore-specific default/override presentation must be reconciled when those scheduled audits are reached rather than creating parallel filter logic now.

# FOLLOWING / FIT TWIN / MY CIRCLE — OWNER LOCKED
- Following is member-controlled.
- Fit Twin is **system-generated** from current-person Match among followed members; current initial threshold starts at 85% Overall Match.
- one `follows` graph only; no second Fit Twin subscription graph.
- `/following` is compatibility-only and routes to `/circle`.
- signed-in `/` uses My Circle as the personalized home.
- Follow alone does not enable notifications.
- person bell ON may auto-follow and subscribes to future activity; bell OFF leaves Follow intact; Unfollow removes the person notification subscription.
- global Following-notification setting defaults OFF and acts as master switch; re-enabling does not backfill missed activity.
- Fit Community gates default wearer relevance before Fit Twin/social presentation; it never modifies the underlying body Match percentage.

# PRODUCT ACTIONS / LIKELOCKER / WISH LOCKER / SHOP — OWNER LOCKED
- **Heart — Like Locker:** Product like/popularity only; no shopping or notification side effect.
- **Shooting star — Wish Locker:** private purchase/wish intent; no Like or notification side effect.
- **Bell — Product Match notification:** one-shot future exact-Product Fit Report alert at 75%+ historical garment Match with required coverage; turns off after qualifying alert until re-enabled; never follows a person or creates Like/Wish.
- **Cart — Shop:** only appears with valid retailer destination; opens/selects retailer; no Like/Wish/Bell side effect.
- zero valid listings → no Shop action; one → direct; multiple → compact retailer picker.
- retailer destinations append/dedupe and commission never changes Match, recommendation, Product identity, search ranking, or retailer choice.

# ADMIN CATALOG / EVIDENCE — OWNER LOCKED TARGET
Admin all-Products/candidate tooling must expose identity status, distinct confirming-member count, identity conflict count, known barcodes and each confidence, retailer links, flags/evidence history, and admin-vs-system promotion provenance. Required filters include Needs Review, Corroborated, Auto-promoted, Verified, Has Conflicts.

Priority:
- weak Provisional/barely Corroborated genuine identity conflict = high;
- Corroborated/auto-promoted with multiple/growing conflicts = medium;
- Verified with one isolated ordinary member conflict = low while retaining evidence;
- multiple independent conflicts, conflicts approaching confirmations, competing Product barcode links, or incorrect-merge signals escalate regardless of status.

# SERPAPI — ADMIN RESEARCH ONLY
SerpAPI is never ordinary member intake or Product authority. Admin research checks private cache first, dedupes queries, distinguishes cached/new results, respects caps, preserves responses, and requires explicit resolution. Raw results never write directly into canonical Product truth. External barcode-provider enrichment remains unimplemented and may be evaluated separately after local scanner/catalog stability.

# RETAIL / AFFILIATE + PURCHASE METRICS — OWNER LOCKED
Retail Link/Product listings and individual purchase context are separate concepts.

Purchase metrics must preserve denominators and never treat skipped answers as inherited data. Track when reporting UI is built:
- eligible Fit Report count and purchase-context response count/rate;
- retailer observations and retailer share among actual respondents;
- Online vs In Store vs Gift distribution;
- average/median/useful price distributions by Product, Brand, Garment Type, and retailer where sample permits;
- month/year trends;
- retailer demand by Brand/Garment Type;
- retailer submission volume vs catalog/search gaps, including signals that retailers such as Walmart or SHEIN need stronger inventory coverage;
- later purchase activity vs Shop-link/affiliate availability/click behavior.

One counted Fit Report contributes at most one acquisition observation. Re-rendering/reprocessing the same Fit Report must not multiply metrics.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# PREFERRED FIT — RETIRED
Preferred Fit by garment type is not current V1 behavior. It is removed from Fit Profile UI, does not affect Match/recommendation/counting/Fit Twin, and legacy DB rows may remain inert. Per-report Intended Fit is separate report/filter metadata.

# FULL OWNER RE-AUDIT ORDER
1. Homepage + complete FAQ — PR #51 approved changes pending live verification.
2. Global header + member Menu + admin entry/navigation.
3. Auth — owner confirmed.
4. Fit Profile — base owner confirmed; Fit Community addition on PR #51 pending live verification.
5. Settings — base owner confirmed; Fit Community editing on PR #51 pending live verification.
6. Notifications.
7. Unified Closet / member profile Closet view — one public Closet; settle immutable/add-missing/correction/lifecycle model.
8. Update/Edit Fit Report within Closet foundation only after mutation model is locked.
9. People My Size — audit Fit Community default/temporary override behavior with current-person Match.
10. My Circle / Following / Fit Twin behavior + legacy redirects — audit Fit Community wearer relevance and signed-in home behavior.
11. New Fit Report — generalized catalog confidence live; PR #51 category-first + purchase persistence + Sleepwear + final review production-authorized pending deployment/live test.
12. New Outfit.
13. Outfits / Style Feed.
14. **Garment/Product detail — explicitly resolve Fit Evidence quality/degradation.** A high body Match must not make a poor Fit Result look positive. Product detail must distinguish “people built like you wore this size” from whether those reports say Too Small/Snug/Just Right/Relaxed/Too Big; determine prominent Fit Evidence/Fit Report warnings and how later dated lifecycle evidence such as Shrunk/Stretched affects recommendation confidence/warnings without rewriting the original Fit Report.
15. Explore — reconcile Fit Community defaults/manual override with existing garment/outfit filters.
16. Search + `/browse` compatibility — reconcile Fit Community defaults/manual override where relevant.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. final mobile/desktop/nav/privacy/copy regression.

Dependency: complete the authorized PR #51 deployment/live test, finish Notifications, then unified Closet/Update before People My Size. Closet components/mutation rules are reused by later social/product/shopping surfaces.

# BETA / POST-BETA ROADMAP — OWNER LOCKED DIRECTION

Before Beta:
- finish ordered member-facing audits and reusable components;
- finish minimum Admin Catalog/Moderation operating tools;
- expand/review starter catalog enough for useful Product hit rate;
- confirm retailer/Shop behavior;
- purchase-context **persistence** is implemented on PR #51; build denominator-aware reporting/admin metrics before Beta decisions depend on it;
- run mobile/desktop/browser, privacy/RLS/security, performance, spam/moderation, and canonical-drift regression;
- controlled Beta cohort; use real search misses, Product corroboration, Match usefulness, social behavior, purchase response coverage, and shopping behavior to drive priorities.

During Beta watch Product hit rate vs manual intake, Fit Report friction, purchase response rates/retailer patterns, People My Size usefulness, Fit Community relevance/default quality, real two-member corroboration, natural five-member promotion, barcode learning/conflicts/duplicates, and catalog gaps. Fix defects only in canonical owning sources.

Early post-Beta perform **Mobile App Options + AI Build Viability** review before a separate app codebase: compare PWA vs React Native/Expo/other shared-code/native approaches; reuse Supabase/backend/domain logic where possible; assess camera/barcode/photo/push/deep-link/auth/store/release/testing needs and what AI can reliably implement vs where owner/specialist help is warranted. Do not promise issue-free app development; if approved, design one canonical mobile architecture before coding.

Other post-Beta work is usage-driven: Product merge/split, richer aliases/locks/moderation, Product-photo promotion, admin SerpAPI research UX, barcode-provider feasibility, evidence tuning, affiliate expansion, catalog growth, recommendation tuning, infrastructure scaling, growth loops, Gift List/public-launch readiness.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- PR #51 is production-authorized but not live until merge + all three pending migrations + Vercel verification complete.
- Purchase-context persistence exists on PR #51; aggregate/admin reporting UI remains to build and must be denominator-aware.
- Fit Community core persistence and People/My Circle filtering exist on PR #51; Search/Explore-specific default/override presentation waits for those scheduled audits.
- Owner live interaction must verify actual Fit Report creation, category filtering, Sleepwear questions, optional purchase persistence, final confirmation, scanner/manual flows, Fit Community first-setup selection/editing, and People/My Circle Men/Women/Both override behavior after deployment.
- Maidenform / Heirloom distinct-second-member production corroboration check is complete; no fake extra accounts are required to prove the automated five-member threshold.
- Exact post-submit mutation behavior remains a Closet audit decision; no unrestricted rewriting.
- Legacy per-garment Private/Shared Closet visibility remains implementation debt.
- Product-detail Fit Evidence/degradation presentation remains deliberately deferred to audit #14 after Closet lifecycle semantics are locked.
- Full admin all-Products confidence/evidence queue; external barcode provider probe; Product merge/split; aliases; spam moderation; Product-photo workflow; field lock/reopen; admin SerpAPI UI; starter-catalog enrichment; Department consensus; material same-member trust semantics; browser behavioral regression; remaining owner page audits all remain open as previously scoped.

# AUDIT COMPLETION RULE
A surface is not complete merely because code exists or automated tests pass. Completion requires current/live inspection, owner interaction review, owner-requested corrections, production verification, explicit owner confirmation, and this master updated.

# CONDENSED DEPLOYMENT / RECOVERY LEDGER
- 2026-08-21 recovery established one canonical production line and source-of-truth safeguards.
- PRs #44–#47 preserved/reconciled the major rework; PR #47 is historical/closed.
- Later `main` production work includes signed-in routing, auth/menu/settings, Notifications foundations, one-shot Product alerts, scanner tuning and barcode confirmation.
- Barcode confirmation commit `490e0da88bac562ac1c8230149000f9f7e509806` deployed READY; production barcode migrations `20260823031508` and `20260823031701` applied.
- PR #49 generalized Product confidence and deployed as `0b569e4a25b7f75a313e57ca94d79286ec3df1df`; production migration `20260823054933` applied; Vercel deployment `dpl_AbdpdRMyvdJ3c7C1sKeDe3qbQK66` READY.
- PR #50 reconciled that production status as `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 branch was created from that clean `main`, owner sanity-checked, expanded with canonical purchase persistence, Sleepwear & Lingerie, Fit Community relevance, and explicitly production-authorized. Its live merge/deployment identifiers are intentionally not recorded until observed.
- Live two-account confidence check proved Maidenform / Heirloom transitions to Corroborated at 2 distinct members while remaining non-canonical below the 5-member promotion threshold.

# EXACT NEXT ACTION — CURRENT
1. Finish exact-head PR #51 CI after the Fit Community/database safeguard correction: canonical integrity, TypeScript, focused app safeguards, build, fresh migration replay, and full database tests.
2. Immediately before deployment, confirm PR #51 remains open/mergeable and branch is 0 behind `main`; reconcile and reverify if `main` changed.
3. Because the three PR #51 database migrations are additive/backward-compatible and the new application reads their structures, apply `20260823130000_add_sleepwear_lingerie_category.sql`, `20260823130100_purchase_context_and_sleepwear_taxonomy.sql`, then `20260823140000_add_fit_community_preference.sql` through the approved Supabase migration path immediately before the authorized merge. Never ad-hoc rewrite applied history.
4. Merge PR #51 through the canonical PR path under the owner's explicit production authorization.
5. Verify the merged `main` Vercel production deployment is READY, production migration history includes all three changes, public homepage/FAQ responds, and no new runtime errors appear.
6. Read-only verify production has exactly the ten active Sleepwear & Lingerie types, purchase-context table/RLS/constraints with no migration-created observations, Fit Community enum/owner-private column/RLS, community-aware match/feed overloads, preserved prior catalog evidence, and unchanged numeric body Match math.
7. Owner then creates real production Fit Reports and checks category filtering, Sleepwear questions, optional purchase data, **Does this look right?**, scanner/manual behavior, successful saves, Fit Community onboarding/editing, and Men/Women/Both temporary views.
8. Update canonical deployment status with observed merge/migration/deployment IDs; then finish Notifications and move into unified Closet mutation/public-view audit.
