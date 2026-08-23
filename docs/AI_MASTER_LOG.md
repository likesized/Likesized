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
- PR #47 is merged/closed historical work, not an active side line.
- Applied database migrations are immutable; corrections use later additive migrations.
- Never create paid Supabase branches or other paid infrastructure.

## Active owner-approved implementation line — VERIFIED, NOT PRODUCTION
- `agent/catalog-evidence-confidence` is the current primary active line for the owner-approved catalog identity-confidence redesign.
- It was created from current `main`; do not start a second product-decision branch while this line is unresolved.
- Branch work includes generalized manual/barcode Product corroboration, five-member automatic Corroborated Product promotion, separate Product-to-barcode confidence, safe Corroborated-candidate size-system defaults, focused pgTAP coverage, and synchronized canonical docs.
- GitHub CI run `32618623877` / run #584 completed successfully after canonical integrity, TypeScript, focused application tests, production build, fresh replay of every canonical migration, and the full canonical database behavior/pgTAP suite.
- Draft PR #49 is **not merged and not deployed**. Production authorization has not been given for this change.

# CANONICAL RECOVERY / LINEAGE STATUS
The 2026-08-21 canonical recovery is complete. Current work is normal owner-approved branch verification against the single `main` production line; the recovery freeze is not being reactivated by this historical status heading.

## Production Supabase checkpoint
Production project: `rlksidwniuoxoacumyaf`.

Latest applied migration tail observed in this audit:
- `20260823031701 require_two_confirmed_barcode_submitters`
- `20260823031508 barcode_confirmation_corroboration`
- `20260823023807 one_shot_matched_product_notifications`
- `20260823015741 default_following_notifications_off`
- `20260823015601 explicit_following_notification_opt_in`
- `20260823010127 add_member_profile_photo_storage`
- `20260822231014 restore_state_based_body_report_identity`
- `20260822230502 compare_body_change_to_latest_report` — applied historical experiment, superseded by restore
- `20260822225515 roll_fit_report_body_identity_baseline`
- `20260822224350 fix_body_identity_conflict_target`
- `20260822223342 garment_relevant_body_report_identity`
- `20260822210009 count_all_distinct_fit_situations`
- `20260822205854 consensus_material_defaults_and_identity_flags`
- `20260822203208 accept_report_scoped_attribute_variants`
- `20260822203048 harden_report_scoped_evidence_writer`
- `20260822202955 fit_report_variant_deduplication`

Supabase-assigned production timestamps may differ from local canonical migration filenames. Never rename an applied local migration to chase the generated production timestamp.

# OWNER RE-AUDIT WORKFLOW — LOCKED

The site underwent a major rework. Except for surfaces explicitly owner-confirmed below, old approvals do not automatically carry forward.

For each page/surface:
1. inspect live/current source/current DB behavior;
2. identify issues before changing unrelated copy/product meaning;
3. owner locks the desired behavior;
4. make the canonical change;
5. verify production behavior;
6. owner explicitly confirms the surface;
7. update this master.

One issue/decision at a time during interactive owner testing.

# OWNER-CONFIRMED / CURRENT AUDIT STATUS

## Homepage + FAQ — NEAR COMPLETE, NOT YET EXPLICITLY RE-CONFIRMED
Signed-in homepage redirects to Style Feed while public informational homepage remains available. Approved FAQ copy is in production. The owner described the signed-in routing as the last homepage change but did not explicitly give a final whole-surface confirmation after that deployment, so do not mark the full homepage audit complete yet.

## Global header / member Menu / admin navigation — NEEDS FINAL RE-CONFIRMATION
Grouped menu was owner-approved visually. Sign Out was later fixed and `Settings` renamed to `Profile Settings`. Those later changes were deployed but the complete menu surface was not explicitly re-confirmed afterward.

## Auth — OWNER CONFIRMED
Signup/Login/Forgot Password/Reset Password recovery behavior has been audited and the owner explicitly confirmed: **Auth is good.**

## Fit Profile — OWNER CONFIRMED
Owner explicitly confirmed the re-audited Fit Profile: **All good.** Preferred Fit UI remains retired.

## Settings — OWNER CONFIRMED
Identity/profile-photo/privacy/notification-setting work was deployed and the owner moved on with **Ok Next**. Treat Settings as owner-confirmed.

## Notifications — ACTIVE AUDIT, NOT YET OWNER-CONFIRMED COMPLETE
Current approved structure includes:
- page header `NOTIFICATIONS` / `What’s new for you.` / `Updates from people you follow and products you’re watching.`
- toolbar actions for Style Feed, Notification settings, and Mark all read when applicable;
- `PRODUCT UPDATES` section;
- `FOLLOWING ACTIVITY` / `Updates from people you follow` section;
- person profile photos/initials, Match context, relevant activity copy/actions;
- empty state `NO NOTIFICATIONS YET` / `Nothing new yet.`
- Settings notification anchor at `/settings#notifications`.

Individual and Mark-all-read behavior covers both Following and Product notification records.

Notification audit remains paused while the owner-approved Product identity-confidence branch awaits production authorization. Resume Audit #6 after this active line is explicitly resolved.

## New Fit Report — OWNER CONFIRMED BASE FLOW; CATALOG CONFIDENCE BRANCH VERIFIED
The owner previously confirmed the reworked New Fit Report flow except barcode scanning. During barcode testing:
- scanner was tuned for ordinary UPC/EAN retail barcodes and became much easier to use;
- owner successfully scanned/submitted Maidenform / Heirloom UPC `196988323504`;
- repeat scan exposed unresolved candidate recognition debt;
- deployed **Is this the item?** confirmation was then observed working by the owner;
- that successful test led to a broader owner decision: barcode presence must not be required for Product corroboration, manual and barcode evidence should feed the same Product identity, and multiple legitimate barcodes must be able to belong to one Product.

The base New Fit Report surface remains owner-approved. The generalized confidence/autofill implementation is fully branch-verified but remains branch-only until explicit production authorization and deployment.

# PRODUCT IDENTITY / BARCODE CONFIDENCE — OWNER LOCKED

## Product identity is intake-method independent
Product identity is the normalized shared garment identity, centered on Brand + Item + Garment Type. Manual entry, barcode-assisted entry, or a mixture of both may support the same candidate.

Locked thresholds:
- **1 distinct member → Provisional.**
- **2 distinct members → Corroborated.**
- **5 distinct confirming members → eligible for automatic canonical Product promotion without admin work**, provided blocking ambiguity is absent.
- automatic promotion creates/maps a **Corroborated** Product, never Verified.
- **Verified** requires stronger authoritative/admin-reviewed evidence and is not a member-vote threshold.
- repeated reports from one member do not create extra Product-identity confirmations.

Member experience:
- Corroborated and Verified Products use essentially the same known-Product/member flow and safe editable defaults;
- the difference is backend trust/precedence, not extra member steps;
- a uniquely matched unresolved Corroborated candidate may provide narrow safe New Fit Report assistance (for example its unique learned broad size-system kind) without appearing as a normal Product/search result.

## Product identity conflict rules
- a genuine identity conflict never erases prior confirmations/history;
- **5 confirmations / 1 conflict may still auto-promote** while retaining review visibility;
- **2+ independent identity conflicts freeze automatic promotion at Corroborated + Needs Review**;
- conflicts equal to or greater than confirmations are Needs Review/no automatic promotion;
- Size, Color, retailer link, legitimate alternate barcode, Fit Result, Material, and report-scoped physical-answer differences are not identity conflicts by themselves;
- if an already-promoted Product later receives a conflict, keep the Product usable and flag/review it rather than deleting/demoting it automatically.

## Barcode is a separate Product relationship
- one Product may legitimately have multiple barcodes/UPCs (for example different retailer/package identifiers);
- first distinct member associating a new barcode with a known Product creates a provisional Product-to-barcode relationship;
- a second distinct member with corresponding Product Fit Report evidence corroborates that barcode relationship;
- once corroborated, the barcode can serve as a canonical Product identifier for future direct recognition;
- a new Target barcode may therefore be learned for a Product already recognized through a Walmart barcode without creating a second Product;
- the same barcode accumulating credible evidence for competing Products is a genuine identity conflict and must not silently auto-select/reassign.

## Scanner member flow
- scan ordinary UPC/EAN retail barcode; QR is not required;
- check canonical identifiers first, unique provisional Product-to-barcode evidence second, and unresolved candidate barcode evidence after that;
- if exactly one identity is known, pause on **Is this the item?**;
- confirmation card shows only Product photo when safe/available, Brand, Item, Category/Type, **Yes — this is the item**, and **No — enter manually**;
- the four normal garment physical questions stay in the Fit Report after confirmation, never on the identity card;
- **Yes** on a Product enters normal known-Product flow;
- **Yes** on a candidate prefills safe candidate identity and continues pending flow;
- **No** or unknown barcode continues manual entry while retaining the barcode as evidence;
- multiple conflicting identities for one barcode are never auto-selected;
- never use another member's Fit Photo/private image as Product imagery.

## Production vs branch implementation
Production still has the older barcode-specific migrations:
- `20260823031508 barcode_confirmation_corroboration`
- `20260823031701 require_two_confirmed_barcode_submitters`

The active branch supersedes their Product-level meaning through later additive migration `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`; applied migrations are not edited. Branch implementation adds generalized candidate confirmation/conflict counts, system promotion provenance, private Product-barcode evidence, separate barcode corroboration, narrow candidate size-system default lookup, and focused tests. The branch passed full CI including fresh migration replay/pgTAP, but it is not production until explicitly authorized and deployed.

Known owner test artifact:
- candidate `de34b6dd-47c9-4795-af77-5117e4f8b554` — Maidenform / Heirloom / bra;
- UPC `196988323504`;
- originally created as audit/test evidence under the old barcode-specific production behavior.

Treat this as audit/test data and inspect carefully during later cleanup; do not remove user data blindly.

# ADMIN CATALOG EVIDENCE / FLAG PRIORITY — OWNER LOCKED

Admin must ultimately be able to inspect all Products/candidates with status/evidence/flags, including:
- Product/candidate identity status;
- distinct confirming-member count;
- identity conflict count;
- known barcodes and each barcode's confidence;
- retailer links;
- open flags/evidence history;
- admin-vs-system canonicalization provenance.

Required filters include Needs Review, Corroborated, auto-promoted, Verified, and Has Conflicts.

Queue priority is confidence-aware:
- weak Provisional/barely Corroborated identity conflict = **high priority** because bad identity should be stopped before it becomes entrenched;
- Corroborated/auto-promoted Product with multiple or growing conflicts = **medium priority**;
- Verified Product with one isolated conflicting member submission = **low priority** while the conflict remains recorded;
- multiple independent conflicts, conflicts approaching confirmations, competing Product barcode links, or incorrect-merge signals escalate regardless of status.

Low priority means safe to review later, never delete or ignore evidence.

# OWNER-LOCKED FIT REPORT RULES

## Counted identity
For a resolved Product, one counted Fit Report represents a distinct state for:
- Member
- exact Product
- normalized Size
- objective physical garment-answer fingerprint
- garment-relevant body state

Fit Result, Intended Fit, Condition, Color, material, retail link, identifier, Department, notes, Product Photo, and Fit Photo do not independently create another counted report.

Size changes create a distinct report. Genuine objective physical controlled-answer changes can create a distinct report.

## Objective fingerprint
- Intended Fit is report/filter metadata only and excluded from physical identity.
- `Not sure` is stored but excluded from positive physical identity.

## Garment-relevant body state
Use the same canonical Product measurement map as Fit Match: `private.product_match_measurements(product_id)`.

Rules:
- irrelevant measurement changes never split a report;
- blank→filled relevant measurement enriches a compatible report;
- value→blank does not create a report or erase established evidence;
- established relevant values compare via `abs(new-old)/abs(old)`;
- under 2% = compatible;
- 2% or more = materially different from that candidate state;
- direction is symmetric;
- accepted under-2% values become the report's rolling active baseline;
- returning to an already represented body state reuses the compatible historical state report;
- original `fit_profile_version_id` remains immutable while `match_fit_profile_version_id`/private baseline may advance.

One member may have multiple legitimate counted reports when Size, objective physical variant, or garment-relevant body state is genuinely distinct. Evidence counting and unique-wearer presentation are separate.

There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big and is not a star score.

# MATERIAL / PRODUCT EVIDENCE — CURRENT

## Material default
- member-derived default uses exact complete submitted recipes from valid counted Fit Reports;
- never average percentages;
- unique most-common recipe wins;
- tie clears the non-verified member default;
- verified authoritative material evidence outranks member defaults;
- updating the same counted report replaces that report's prior recipe vote.

Current recipe-frequency selection counts Fit Reports. Product identity confidence thresholds do not silently change material-recipe trust semantics.

## Garment Type conflict
Garment Type is Product identity. A known-Product Type conflict preserves the member report unresolved, marks candidate Needs Review, flags the canonical Product, excludes the conflicted report from normal exact-Product evidence, and requires later audited resolution.

# SIZE SYSTEM — OWNER LOCKED

- actual member size always starts blank;
- known Product may preselect the unique most-common prior normalized broad size-system kind;
- uniquely matched unresolved Corroborated candidate may also preselect its unique most-common prior broad size-system kind from distinct-member evidence;
- tie/no history gives no preselection;
- member can change the suggested system;
- first/second unresolved submitters may therefore choose manually; later Corroborated users can benefit from the learned default;
- nested US/UK/EU choices are not part of this broad-size default unless separately approved.

# PREFERRED FIT — RETIRED

Preferred Fit by garment type is not current V1 behavior.
- removed from Fit Profile UI;
- not a current Match/recommendation input;
- does not affect counted Fit Report identity or Fit Twin status;
- legacy DB rows may remain preserved/inert.

Intended Fit on an individual Fit Report remains separate report/filter metadata.

# FOLLOWING / FIT TWIN / PERSON NOTIFICATION — OWNER LOCKED

- Following is member-controlled and drives Style Feed.
- Fit Twin is **system-generated** among followed members from current-person Match; current initial threshold starts at 85% Overall Match.
- one `follows` graph only.
- Follow alone does **not** enable notifications.
- person bell ON auto-follows if necessary and explicitly subscribes to future activity notifications.
- person bell OFF stops future notifications but keeps the follow.
- Unfollow removes the person notification subscription.
- both Follow and person notification are non-default.
- Profile Settings Following notifications preference is a global master switch over chosen person bells and defaults OFF; turning it back on does not backfill missed events.

# PRODUCT ACTIONS / LIKELOCKER / WISH LOCKER / SHOP — OWNER LOCKED

Every Product action is independent:
- **Heart — Like Locker:** adds/removes the Product from Like Locker and contributes to Product popularity/like count. No shopping intent and no notifications.
- **Shooting star — Wish Locker:** adds/removes private purchase/wish-list intent. No Like and no notifications. Wish Locker is surfaced within the Like Locker page.
- **Bell — Product Match notification:** no Like/Wish/follow side effect. It is a one-time opt-in alert for a future new Fit Report on that exact Product that matches the member at **75%+ historical garment Match with required measurement coverage**. After the qualifying alert fires, the bell turns off until the member enables it again.
- **Cart — Shop:** opens/selects a valid retailer destination. No Like/Wish/Bell side effects. If no valid retailer link exists, no cart/Shop action appears.

Product bell is fundamentally different from person bell. Product bell never auto-likes and never follows a person.

# PRODUCT NOTIFICATIONS — LIVE BACKEND / UI AUDIT PENDING

Production migration `20260823023807 one_shot_matched_product_notifications` changed old generic Product evidence watches into the owner-locked one-shot 75%+ matched-report alert behavior.

Notification card wording/actions still require final owner confirmation in the active Notifications page audit.

# CONTROLLED CATALOG — OWNER LOCKED

> **Members contribute garments and Fit Reports. Members do not directly create canonical Products. Controlled system rules may automatically promote a community candidate after the locked five-distinct-member threshold.**

Unknown submissions:
- create/associate pending candidate/evidence;
- remain usable in Closet;
- do not become pseudo-Products in ordinary search;
- at two distinct confirming members may become Corroborated and provide narrow safe New Fit Report defaults;
- at five distinct confirming members may be automatically mapped/created as a Corroborated canonical Product when conflict gates permit it;
- admin resolution remains available for ambiguous/flagged cases;
- mapping preserves immutable member fit/body evidence.

Raw member text, one barcode, retailer URL, Style/Article Number, external title, Shopping product ID, color, size, retailer, or fuzzy title alone cannot define canonical Product identity.

Candidate workflow states:
- Pending Product
- Needs Enrichment
- Needs Review
- Merged

Identity confidence is separate: Provisional / Corroborated / Verified / Rejected where applicable.

# SERPAPI — ADMIN RESEARCH ONLY

SerpAPI is never ordinary member intake or Product authority.
- private cache first;
- dedupe equivalent queries;
- distinguish cached/new results;
- respect usage caps;
- preserve reusable research;
- require explicit resolution;
- raw SerpAPI results never write directly into canonical Product truth.

External barcode enrichment is **not currently implemented**. An admin-only/zero-write barcode provider probe may be evaluated separately after the local LikeSized scanner/catalog flow is stable.

# RETAIL / AFFILIATE — OWNER LOCKED

One Product may have zero, one, or multiple valid retailer destinations.
- zero → no cart/Shop action;
- one → direct retailer route;
- multiple → compact retailer picker;
- destinations append/dedupe, never silently overwrite each other;
- commission never affects Match, recommendation, Product identity, search rank, or retailer choice.

Locked disclosure when required:
**“LikeSized may earn a commission from purchases made through our shopping links.”**

# FULL OWNER RE-AUDIT ORDER

1. Homepage + complete FAQ
2. Global header + member Menu + admin entry/navigation
3. Signup/Login/Check Email/Forgot Password/Reset Password/auth errors
4. Fit Profile
5. Settings
6. Notifications
7. People My Size
8. Member profile/Shared Closet
9. My Circle/Following/Fit Twin behavior + legacy redirects
10. My Closet
11. Update/Edit Fit Report
12. New Fit Report — base owner-confirmed; generalized catalog confidence branch verified, awaiting production authorization
13. New Outfit
14. Outfits/Style Feed
15. Garment/Product detail
16. Explore
17. Search + `/browse` compatibility
18. LikeLocker/Wish Locker
19. Full Admin Catalog + Moderation
20. final mobile/desktop/nav/privacy/copy regression

# CURRENT IMPLEMENTATION DEBT / OPEN WORK

- generalized catalog-confidence migration/application changes are verified on `agent/catalog-evidence-confidence` but are not yet production-deployed;
- production owner interaction still must validate the manual two-member Corroborated default flow, five-member automatic promotion, conflict gates, and alternate-barcode Product recognition after authorization/deployment;
- full admin all-Products status/evidence/flags view and confidence-aware queue sorting/filtering remain Audit #19 work;
- external barcode provider probe/test not yet implemented;
- final owner confirmation of Notifications after matched Product alert semantics/copy;
- broader Product action UI rollout/audit across Product cards/details where not yet implemented;
- Product-to-Product merge tooling;
- audited Product/candidate split tooling;
- complete alias management UX;
- complete spam garment-submission/Fit Report moderation;
- complete pending→canonical Product-photo workflow;
- complete field lock/reopen UX;
- admin SerpAPI single/batch research UI, cache indicators and caps;
- starter-catalog item-by-item enrichment/review;
- Department consensus/default behavior beyond current evidence foundations;
- material trust/corroboration semantics for same-member multiple recipe votes;
- browser-level behavioral regression coverage;
- remaining owner page-by-page re-audit.

# AUDIT COMPLETION RULE

A surface is not complete merely because code exists or automated tests pass. Completion requires current source/live inspection, owner interaction review, owner-requested corrections, production verification, explicit owner confirmation, and this master updated.

# CONDENSED DEPLOYMENT / RECOVERY LEDGER

- 2026-08-21 recovery established one canonical production line and source-of-truth safeguards.
- PRs #44–#47 preserved/reconciled the major rework; PR #47 is merged/closed.
- Canon reconciliation completed before the fresh owner site audit.
- Subsequent `main` production work includes signed-in homepage routing, auth recovery fixes, menu/signout fixes, Settings/profile-photo/privacy changes, Notifications layout/person opt-in semantics, one-shot matched Product notifications, and barcode scanner tuning.
- Scanner tuning commit `cd1b1f197e72affba88f767c02d6fc714a85ef6a` was deployed READY before the barcode confirmation work.
- Barcode confirmation implementation commit `490e0da88bac562ac1c8230149000f9f7e509806` deployed to production as Vercel `dpl_3wtrHjFTPE4LdmPDvtyFmWZRJ84n`, **READY**. Production DB migrations `20260823031508` and `20260823031701` are applied.
- Owner then approved replacing barcode-gated Product corroboration with intake-method-independent Product confidence, separate multi-barcode confidence, five-member automatic Corroborated Product promotion, conflict gates, and confidence-aware admin priority.
- Active branch `agent/catalog-evidence-confidence` contains this replacement architecture in a later additive migration plus application/tests/docs. GitHub CI run `32618623877` / run #584 passed every gate, including a fresh migration replay and full database behavior suite. **No production merge/deployment has occurred for this branch.**

# EXACT NEXT ACTION — CURRENT

Owner review/authorization checkpoint for draft PR #49:
1. branch verification is complete and green;
2. do not merge or deploy without explicit owner authorization;
3. if the owner authorizes production, merge the verified branch into `main` through the controlled production path and apply the new ordered Supabase migration;
4. verify production deployment/database migration state;
5. owner-test manual two-member Corroborated default behavior, five-member automatic Product promotion, conflict blocking/review visibility, and alternate-barcode Product recognition;
6. after owner confirmation, resume Audit #6 Notifications and then proceed to #7 People My Size.
