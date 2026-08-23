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

# CURRENT STATUS — 2026-08-22

## Canonical production line
- `main` is the one canonical implementation line and is coupled to production Vercel deployment.
- PR #47 is merged/closed historical work, not an active side line.
- Production changes in this audit are made directly in canonical files only after owner approval.
- Applied database migrations are immutable; corrections use later additive migrations.
- Never create paid Supabase branches or other paid infrastructure.

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

Notification audit was interrupted by owner barcode testing. Return here after barcode owner re-test.

## New Fit Report — OWNER CONFIRMED EXCEPT BARCODE FLOW RE-TEST
The owner previously confirmed the reworked New Fit Report flow except barcode scanning. During current barcode testing:
- original generic scanner was too difficult to read ordinary UPC/EAN retail barcodes;
- scanner was tuned to a 1-D reader/high-resolution camera request and owner reported it became **much easier**;
- owner successfully scanned and submitted a Maidenform / Heirloom bra with UPC `196988323504`;
- repeat scan exposed that unresolved candidate barcodes were not recognized;
- owner locked the new **Is this the item?** confirmation behavior described below.

Barcode interaction remains open until the owner re-tests the deployed confirmation flow and explicitly confirms it.

# BARCODE SCANNER / IDENTITY — OWNER LOCKED

Member flow:
- scan ordinary UPC/EAN retail barcode; QR is not required;
- check LikeSized canonical identifiers first and unresolved candidate barcode evidence second;
- if exactly one identity is known, pause on **Is this the item?** and show the known Product/candidate identity;
- **Yes — this is the item** records that member's explicit barcode confirmation and populates known identity fields;
- **No — enter manually** switches to manual entry while retaining the barcode with the Fit Report as evidence;
- unknown barcode keeps the scan and proceeds to manual entry;
- multiple conflicting identities for one barcode must never be auto-selected.

Canonical vs pending:
- canonical Product Yes → normal known-Product path;
- unresolved candidate Yes → prefill previously seen Brand / Item / Garment Type, but keep the new report unresolved/pending until authorized catalog resolution;
- the confirmation suggestion is not an ordinary Product search result and does not turn a candidate into a canonical Product.

Identity confidence:
- first member evidence = provisional;
- **two distinct members must each scan/confirm Yes for the same barcode identity and each complete corresponding Fit Report/submission evidence** before identity confidence can become corroborated;
- multiple reports from one member do not satisfy the distinct-member rule;
- Verified still requires stronger authoritative/admin-reviewed evidence;
- when a corroborated candidate is later authorized/mapped into a provisional canonical Product, its confirmation evidence transfers and may preserve corroborated confidence; never auto-promote to verified.

Production DB implementation:
- `catalog_candidates.identity_confidence` separates identity evidence strength from candidate workflow status;
- `private.barcode_identity_confirmations` stores private confirmation events;
- `public.lookup_barcode_catalog_match(...)` exposes only safe unique identity suggestions;
- `public.confirm_barcode_catalog_match(...)` records validated authenticated confirmations;
- production migration `20260823031508 barcode_confirmation_corroboration` established the flow;
- production migration `20260823031701 require_two_confirmed_barcode_submitters` tightened the initial implementation so both distinct members themselves must have explicit confirmations.

Known owner test artifact from this interaction:
- pending candidate `de34b6dd-47c9-4795-af77-5117e4f8b554` — Maidenform / Heirloom / bra;
- UPC `196988323504`;
- first submission count currently 1;
- identity confidence currently `provisional`;
- confirmation count was 0 immediately after the migration, before owner re-test.

Treat this as audit/test data and inspect carefully during later cleanup; do not remove user data blindly.

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

# MATERIAL / PRODUCT EVIDENCE — CURRENT

## Material default
- member-derived default uses exact complete submitted recipes from valid counted Fit Reports;
- never average percentages;
- unique most-common recipe wins;
- tie clears the non-verified member default;
- verified authoritative material evidence outranks member defaults;
- updating the same counted report replaces that report's prior recipe vote.

Current recipe-frequency selection counts Fit Reports. The separate distinct-member barcode identity corroboration rule does not silently change material-recipe trust semantics.

## Garment Type conflict
Garment Type is Product identity. A known-Product Type conflict preserves the member report unresolved, marks candidate Needs Review, flags the canonical Product, excludes the conflicted report from normal exact-Product evidence, and requires later admin resolution.

# SIZE SYSTEM — CURRENT

- actual member size always starts blank;
- known Product may preselect the unique most-common prior normalized size-system kind;
- tie/no history gives no preselection;
- member can change the suggested system;
- unresolved/manual flow starts at Choose your measurement system.

# PREFERRED FIT — RETIRED

Preferred Fit by garment type is not current V1 behavior.
- removed from Fit Profile UI;
- not a current Match/recommendation input;
- does not affect counted Fit Report identity or Fit Twin status;
- legacy DB rows may remain preserved/inert.

Intended Fit on an individual Fit Report remains separate report/filter metadata.

# FOLLOWING / FIT TWIN / PERSON NOTIFICATION — OWNER LOCKED

- Following is member-controlled and drives Style Feed.
- Fit Twin is system-derived among followed members from current-person Match; current initial threshold starts at 85% Overall Match.
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

# CONTROLLED CATALOG — LOCKED

> **Members contribute garments and Fit Reports. Members do not directly create canonical Products.**

Unknown submissions:
- create/associate pending candidate/evidence;
- remain usable in Closet;
- do not become pseudo-Products in ordinary search;
- may later be safely mapped without rewriting immutable member fit/body evidence.

Raw member text, barcode, retailer URL, Style/Article Number, external title, Shopping product ID, color, size, retailer, or fuzzy title alone cannot define canonical Product identity.

Candidate workflow states:
- Pending Product
- Needs Enrichment
- Needs Review
- Merged

Identity-confidence state is separate: provisional / corroborated / verified where applicable.

# SERPAPI — ADMIN RESEARCH ONLY

SerpAPI is never ordinary member intake or Product authority.
- private cache first;
- dedupe equivalent queries;
- distinguish cached/new results;
- respect usage caps;
- preserve reusable research;
- require explicit resolution;
- raw SerpAPI results never write directly into canonical Product truth.

External barcode enrichment is **not currently implemented**. An admin-only/zero-write barcode provider probe may be evaluated separately after the local LikeSized scanner flow is stable.

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
12. New Fit Report — confirmed except current barcode re-test
13. New Outfit
14. Outfits/Style Feed
15. Garment/Product detail
16. Explore
17. Search + `/browse` compatibility
18. LikeLocker/Wish Locker
19. Full Admin Catalog + Moderation
20. final mobile/desktop/nav/privacy/copy regression

# CURRENT IMPLEMENTATION DEBT / OPEN WORK

- owner re-test of the new barcode **Is this the item?** flow and repeat scan of the Maidenform/Heirloom UPC;
- external barcode provider probe/test not yet implemented;
- final owner confirmation of Notifications after matched Product alert semantics/copy;
- broader Product action UI rollout/audit across Product cards/details where not yet implemented;
- Product-to-Product merge tooling;
- audited Product/candidate split tooling;
- complete admin queue/tab UX;
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
- Scanner tuning commit `cd1b1f197e72affba88f767c02d6fc714a85ef6a` was deployed READY to production before the barcode confirmation/corroboration change set.

# EXACT NEXT ACTION — CURRENT

Deploy and verify the canonical **Is this the item?** barcode confirmation flow against production migrations `20260823031508` and `20260823031701`, then have the owner re-scan UPC `196988323504`.

Expected owner test:
1. scan the same retail barcode;
2. LikeSized shows Maidenform · Heirloom on **Is this the item?**;
3. tap Yes;
4. Brand / Item / Garment Type populate and the report remains unresolved/pending;
5. the first member alone does not raise confidence above provisional.

After owner confirms barcode behavior, finish Audit #6 Notifications, then proceed to #7 People My Size.
