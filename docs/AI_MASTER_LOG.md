# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current status record, owner-decision ledger, implementation-debt ledger, deployment checkpoint, and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; sole roadmap/status/decision/handoff record.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems, or a second master plan.

# CURRENT STATUS — 2026-08-22

## Canonical production line
- `main` is the single canonical implementation line and the source deployed to production.
- PR #47 (`correct-grouped-menu-layout`) is **merged and closed**, not an active side line. It merged to `main` as `b5d816d3b3293e262a78896e14e5e3657cd03834` on 2026-08-22.
- The last production deployment inspected immediately before this reconciliation was Vercel deployment `dpl_8NK7FFHHE76cRih1QRfab26pS715`, **READY**, target `production`, from `main` commit `0e23289486890ef5f78c5fb450cdf73b5a9f425c`.
- The canonical Product Spec was reconciled to current production behavior in commit `0626f20cc232702186489db83559b8802ece92ff`.
- The canonical database contract was reconciled to live production behavior in commit `2edcfee6f12e6d4c2c9849f167a7002d822cf1c9`.
- This master reconciliation follows those two current-truth rewrites. Exact current HEAD is always the tip of `main`; do not freeze architecture to a self-referential commit number.

## Production Supabase checkpoint
Production project `rlksidwniuoxoacumyaf` was inspected during reconciliation.

Latest observed applied migration tail:
- `20260822231014 restore_state_based_body_report_identity`
- `20260822230502 compare_body_change_to_latest_report` — applied historical experiment, superseded by the later restore migration
- `20260822225515 roll_fit_report_body_identity_baseline`
- `20260822224350 fix_body_identity_conflict_target`
- `20260822223342 garment_relevant_body_report_identity`
- `20260822210009 count_all_distinct_fit_situations`
- `20260822205854 consensus_material_defaults_and_identity_flags`
- `20260822203208 accept_report_scoped_attribute_variants`
- `20260822203048 harden_report_scoped_evidence_writer`
- `20260822202955 fit_report_variant_deduplication`
- `20260822195045 add_product_size_kind_default_rpc`
- submission-first catalog/admin migrations are also applied in production.

Applied migrations are immutable. Superseded behavior is corrected only by later additive migrations.

# CANONICAL RECONCILIATION — COMPLETE

The 2026-08-22 reconciliation replaced stale branch/checkpoint wording with current production truth in all three canonical current-state documents:
- `docs/AI_MASTER_LOG.md`
- `docs/V1_PRODUCT_SPEC.md`
- `supabase/schema_contract.md`

The reconciliation explicitly resolves these prior conflicts:
- PR #47 is merged/closed; it is no longer the active implementation line.
- submission-first catalog behavior is live production truth, not branch-only proposed behavior.
- the Fit Report body-state migrations are applied production truth.
- counted Fit Reports use state-based reuse, not chronological episode identity.
- garment-relevant body identity comes from the same Product measurement map as Fit Match.
- body-state comparison is direction-independent with a 2% threshold.
- accepted under-2% updates roll the active report baseline.
- returning to an already represented body state reuses that report.
- blank→filled relevant measurements enrich compatible reports rather than splitting them.
- Intended Fit is excluded from objective counted-report identity.
- `Not sure` is stored but excluded from positive physical identity claims.
- material defaults use exact recipe frequency, never averaged percentages.
- Garment Type conflicts preserve member work as unresolved review instead of rewriting Product truth.
- known Products may preselect a unique learned most-common **size-system kind**; the actual member size still starts blank.
- Preferred Fit by garment type is retired/inert and no longer current member or recommendation behavior.
- the entire site has been reset for owner re-audit after the major rework, except the New Fit Report surface as noted below.

# SOURCE / CHANGE DISCIPLINE — LOCKED

- Work directly in the correct canonical files on `main` unless the owner explicitly authorizes another branch/workflow.
- No patch/fixed/v2/temp/backup duplicates.
- Do not preserve stale competing current-state files or wording.
- Do not restore old files wholesale from historical branches.
- Git history preserves superseded work; current source must contain one current answer.
- Database corrections remain append-only migrations after anything has been applied.
- Never create paid Supabase branches or other paid infrastructure without explicit owner authorization.

# CONFIRMED SURFACE STATUS

## New Fit Report — CONFIRMED EXCEPT BARCODE SCANNER
The owner has interaction-tested and confirmed the reworked New Fit Report flow except barcode scanning, which is intentionally left open for future testing.

Do not rework confirmed New Fit Report behavior during the site sweep unless a regression is discovered or the owner changes a decision.

Confirmed behavior includes:
- internal LikeSized Product search with manual unresolved fallback;
- exact known Product selection;
- member can continue when Product is unknown;
- known Product vs pending-candidate handling;
- Product identity conflict routing to admin review instead of silent overwrite;
- controlled Garment Type/questions/Color/Size/Fit Result/Condition intake;
- optional retail/identifier/material/Product Photo/Department evidence;
- added vs updated vs under-review success states;
- state-based counted Fit Report identity;
- meaningful body-state reuse/splitting under the rules below;
- Preferred Fit member UI removed.

Open on this page:
- **barcode scanner owner interaction testing only**.

# OWNER-LOCKED FIT REPORT RULES

## Counted identity
For a resolved Product, a counted Fit Report represents one distinct body-fit state for:
- Member
- exact Product
- normalized Size
- objective physical garment-answer fingerprint
- garment-relevant body state

A new counted report is **not** created merely because Fit Result, Intended Fit, Condition, Color, material, retail link, identifier, Department, notes, Product Photo, or Fit Photo changed.

Size change creates a distinct report identity.
A genuine objective physical controlled-answer change can create a distinct report identity.

## Objective fingerprint
- Intended Fit is report/filter metadata only and is excluded from objective physical identity.
- `Not sure` is excluded from positive physical identity.

## Garment-relevant body state
Use the same canonical Product measurement relevance source as Fit Match: currently `private.product_match_measurements(product_id)`.

Do not hard-code a second report-specific measurement list.

Rules:
- irrelevant measurement changes never split a report for that Product;
- blank → filled relevant measurement strengthens/enriches a compatible report;
- value → blank does not create a new report by itself or erase established baseline evidence;
- already-established relevant value changes are compared as `abs(new-old)/abs(old)`;
- under 2% = compatible with that report state;
- 2% or more = materially different from that candidate state;
- direction is symmetric;
- accepted under-2% values become the report's rolling active baseline;
- if another existing report already represents the current body state, reuse/update that report instead of creating another chronological episode;
- original `fit_profile_version_id` remains immutable history while `match_fit_profile_version_id`/private state baseline may advance for matching and state reuse.

## Legitimate multiple reports from one member
One member can have multiple counted reports for one Product when Size, physical objective variant, or garment-relevant body state is genuinely distinct.

Product evidence summaries may count all legitimate distinct Fit Report situations. Member-facing wearer lists should separately avoid repeating one person in top wearer slots solely because that person has multiple reports.

# MATERIAL / PRODUCT EVIDENCE — CURRENT

## Material default
- Member-derived Product material default uses exact complete submitted recipes from valid counted Fit Reports.
- Never average percentages into a recipe nobody submitted.
- Unique most-common exact recipe wins.
- Tie clears the non-verified member default.
- Verified authoritative material evidence outranks member defaults.
- Updating the same counted Fit Report replaces its prior material recipe evidence rather than adding a second vote.

Current production uses Fit Report vote count for the winning recipe and currently marks 2+ winning report votes `corroborated`. This means same-member multiple valid reports can currently contribute to that status. **Recipe-frequency selection is accepted current behavior; distinct-member trust/corroboration semantics remain an explicit later audit item and must not be silently changed.**

## Garment Type conflict
Garment Type is Product identity.

When a known Product's canonical Type conflicts with the member submission:
- preserve the member report unresolved (`product_id = NULL`);
- mark candidate Needs Review;
- flag the canonical Product for review;
- exclude pending conflict from normal exact-Product evidence;
- admin later corrects Product, maps to another Product, or dismisses/rejects the disputed identity.

# SIZE SYSTEM — CURRENT

- Actual member size always starts blank.
- For a known Product, LikeSized may preselect the unique most-common prior normalized size-system kind.
- A tie or no history gives no preselection.
- The member can change the suggested system.
- Unknown/manual Product flow starts at Choose your measurement system.

Do not restore the old blanket rule that size system must always start blank for known Products.

# PREFERRED FIT — RETIRED

The old **Preferred fit by garment type** member feature is not current V1 behavior.

- Removed from Fit Profile UI.
- Not a current Match or recommendation input.
- Does not affect counted Fit Report identity or Fit Twin status.
- Existing legacy preference rows may remain preserved/inert so normal measurement edits do not mutate historical data unexpectedly.
- Production function inspection found the legacy table referenced by profile-save preservation but not by current Match/recommendation functions.

Do not reintroduce Preferred Fit without a new owner decision.

This does not remove **Intended Fit** from a Fit Report; Intended Fit remains report/filter metadata and is simply excluded from counted physical identity.

# CONTROLLED CATALOG — LOCKED

Core rule:

> **Members contribute garments and Fit Reports. Members do not directly create canonical Products.**

Member flow:
**Search LikeSized → select exact Product if known → otherwise short manual fallback and keep going.**

Unknown submissions:
- create/associate pending candidate/evidence;
- remain usable in the member's Closet;
- do not become pseudo-Products in ordinary Product search;
- can later be mapped without rewriting immutable member fit/body evidence.

Canonical Product resolution is conservative. Raw member text, barcode, retailer URL, Style/Article Number, external title, Google Shopping `product_id`, color, size, retailer, or fuzzy title does not by itself define Product identity.

Reviewed Brand/Product aliases normalize proven naming variants without creating duplicate public identities.

# PENDING CANDIDATES / FLAGS — LOCKED

Candidate lifecycle:
- Pending Product
- Needs Enrichment
- Needs Review
- Merged

A resolved canonical Product is the Verified Catalog Item state.

Admin queue priority should favor real member demand, especially submission count/frequency, with recency, affected reports, flags, and admin judgment as additional signals.

Required review families:
- Possible Duplicate
- Conflicting Product Fact
- Ambiguous Catalog Identity / Needs Review
- Reported / Spam Content
- Retail / Identifier Conflict

Flags do not rewrite Product truth by themselves. Resolution must be authorized and auditable.

# ADMIN — TARGET OPERATING MODEL

Only authorized admins may access catalog/moderation controls.

Required primary areas:
1. Catalog Enrichment
2. Conflicting Product Facts
3. Possible Duplicates / Identity Review
4. Reported / Spam Content
5. Review / Audit History

Admin must ultimately be able to inspect candidate evidence/demand, map/create, merge/split, manage aliases, verify/lock/reopen facts, moderate Fit/Product/Outfit photos and spam submissions/Fit Reports, resolve retailer/identifier conflicts, inspect cached SerpAPI research, and perform accountable research/resolution actions.

Current `/moderation` is a working foundation but is **not owner-confirmed** and is included in the full re-audit.

# SERPAPI — ADMIN RESEARCH ONLY

SerpAPI is never ordinary member intake or Product authority.

Admin research uses the private cache first, dedupes equivalent queries, distinguishes cached/new results, respects usage limits, preserves research, and requires explicit resolution after research.

Completed benchmark evidence remains reusable:
- 150/150 starter searches completed;
- 5,901 raw Shopping listings preserved in private cache;
- temporary benchmark writer retired.

Do not let raw SerpAPI results write directly to `products`.

# STARTER CATALOG — CURRENT

The owner-supplied starter catalog remains launch-preparation/research data.

- Do not invent metadata.
- Specific reviewed entries may become canonical selectable Products.
- Broad/ambiguous entries remain pending/enrichment/review candidates.
- Reuse cached research before spending new searches.

Starter-catalog item-by-item enrichment/review remains open work.

# MATCH / RECOMMENDATION — PRESERVE

Core promise: **See what fits people built like you.**

- Match % = garment-relevant body similarity, not probability of fit.
- Current-person Match is symmetric.
- Historical garment Match uses try-on/body-state evidence.
- Confidence where exposed is qualitative: High / Good / Limited.
- Missing optional measurements reduce refinement/confidence rather than inventing values.
- Chest and Full Bust remain distinct.
- derived proportion refinement stays small/private: total influence max 8%, final Match movement max ±4 points.
- shoes: Foot Length dominant / Foot Width secondary.
- outerwear may use modest layering tolerance; suit jackets/blazers remain more precise.
- Altered evidence stays history but is excluded from normal recommendation evidence.
- `Would Buy Again` does not affect size recommendation/confidence.

Recommendation hierarchy:
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Recovered weights:
- Exact Variant 1.00
- Exact Product 0.94
- Product Family 0.82
- Similar Garments 0.70
- Brand + Garment Type 0.58
- Category Fit 0.42

Help Me Size It is fallback only and reuses the canonical recommendation engine.

# FOLLOWING / FIT TWIN — LOCKED

- Following is member-controlled.
- Fit Twin is system-derived among followed members from strong current-person Match.
- One `follows` graph only.
- Follow / Following / Unfollow are member actions.
- Public count is Followers.
- Initial Fit Twin threshold is configurable and currently 85% Overall Match.
- Style Feed subscription is Following-driven.

# EXPLORE / SEARCH — PRESERVE FOR RE-AUDIT

Owner-locked design currently includes:
- `/explore` canonical; `/browse` redirect only;
- Garments | Outfits;
- My Fit Matches | All;
- fresh visit defaults My Fit Matches;
- Garments My Fit Matches 75%+ historical garment Match;
- Outfits My Fit Matches 75%+ creator current Overall Match;
- tiers 90–99 → 85–89 → 80–84 → 75–79;
- ranking inside tier: Match → freshness/unseen → recency → popularity;
- carousel 8, initial 24, +24 browsing;
- strict taxonomy filters with no silent relaxation;
- ordinary Product results dedupe to canonical Product;
- pending unresolved submissions are not pseudo-Products;
- no blank image state and no star Fit Rating.

This surface is not owner-confirmed after the major rework until its scheduled audit.

# RETAIL / SHOPPING — OWNER LOCKED

One Product may have zero, one, or multiple valid retailer destinations.

- zero → no Shop/cart action;
- one → direct retailer route;
- multiple → compact retailer picker;
- valid listings append/dedupe and do not overwrite one another;
- clean retailer destination/provenance is preserved beneath affiliate routing;
- commission never affects Match, recommendation, Product identity, search rank, or retailer selection.

Where a valid destination exists, relevant garment actions are:
**Like + Wishlist + Shopping Cart/Shop**.

If no valid retailer link exists, shopping disappears entirely.

Same conditional rule applies to Product/Garment details, Shop Here equivalents, Wish Locker, Gift Lists, and other approved shopping surfaces.

Locked disclosure when required:
**“LikeSized may earn a commission from purchases made through our shopping links.”**

# LIKELOCKER / OUTFITS / STYLE FEED — PRESERVE

LikeLocker is private saved fashion, not people:
- Garments
- Outfits
- Wish Locker

Product Like, Outfit Like, and purchase intent remain distinct.

Outfits remain V1:
- use owned Closet garments;
- owned Outfits in My Closet;
- discovery in Explore;
- followed-person activity in Style Feed;
- Outfit likes contribute Style Likes; Product likes do not;
- no second Product/taxonomy system.

# PUBLIC HOMEPAGE / FAQ — REQUIRED MEANING

The homepage remains useful logged out and keeps FAQ inline.

The coming owner audit must ensure the public story accurately explains:
- measurement privacy;
- Match %;
- current-person vs historical garment Match;
- People My Size;
- Following vs Fit Twin;
- Private vs Shared Closet;
- Fit Photo vs Product Photo;
- Fit Result/no stars;
- Help Me Size It;
- LikeLocker/Wish Locker;
- Outfits/Style Feed;
- controlled community catalog;
- search LikeSized first;
- unknown item can still be logged immediately;
- unresolved item can be researched/resolved later;
- member evidence can improve/conflict with Product facts;
- admins resolve ambiguous identities;
- SerpAPI is admin research, not Product authority;
- shopping/affiliate behavior and disclosure where applicable;
- immutable historical try-on body state;
- Gift Lists if implemented.

Remove stale Preferred Fit and old member-facing external/API import wording anywhere it still appears.

# FULL OWNER RE-AUDIT RESET — LOCKED

Because the site underwent a major rework, prior page approvals are not automatically carried forward.

**Only New Fit Report is currently owner-confirmed, except barcode scanner testing remains open. Every other page/surface is NEEDS OWNER RE-AUDIT.**

Audit in this order:

1. **Homepage + complete FAQ** — full public story, layout/order, copy, CTAs, logged-in/logged-out behavior, catalog/Fit Report explanations, privacy, Match, shopping, stale concepts, mobile/desktop.
2. **Global header + member Menu + admin menu entry/navigation** — labels, grouping, destinations, bell, mobile/desktop behavior, admin discoverability, obsolete links.
3. **Signup / Login / Check Email / auth confirmation / auth error / Forgot Password / Reset Password** — full auth path and empty/error states.
4. **Fit Profile** — desktop/mobile, measurements, help diagrams, review/save/revisit, privacy copy, Preferred Fit retirement, measurement semantics.
5. **Settings** — every account/profile/privacy/notification/social setting, stale controls, layout and mobile behavior.
6. **Notifications** — types, copy, read/unread, destinations, privacy, empty states, desktop/mobile.
7. **People My Size** — matching, confidence, cards, filters/sorting if present, privacy and destinations.
8. **Member Profile + Shared Closet** — identity/profile UI, Follow state, Match context, shared garments/outfits, privacy, pending Product display.
9. **My Circle / Following / Fit Twins** — one follows graph, derived Fit Twin, Style Feed relationship, legacy redirects/wording.
10. **My Closet** — garments/outfits, multiple legitimate fit/body states, Fit History, Update Fit/Tried It Again, pending status, sharing, desktop/mobile.
11. **Update/Edit Fit Report** — ensure edit behavior matches current counted identity/body-state rules.
12. **New Fit Report** — already confirmed; regression check only. Barcode scanner remains open for later testing.
13. **New Outfit** — owned-garment selection, photo flow, classification, privacy and validation.
14. **Outfits / Style Feed** — browsing/feed, followed activity, likes, tags, Fit context and privacy.
15. **Garment/Product Detail** — canonical vs pending identity, Product facts, historical Match, Fit Reports, People Like You Who Wore This, Help Me Size It, images, commerce.
16. **Explore** — Garments/Outfits, My Fit Matches/All, filters, ranking, search integration, image fallbacks, mobile browser, Product dedupe.
17. **Search + `/browse` compatibility** — Garments/Outfits/People, canonical grouping, pending exclusion, redirects, mobile behavior.
18. **LikeLocker / Wish Locker** — save/like/wishlist separation, provenance, removal, Fit context, shopping.
19. **Full Admin Catalog + Moderation** — admin entry plus every operating queue/control: Catalog Enrichment, demand ordering, Product conflicts, Possible Duplicates/Identity Review, Reported/Spam, audit history, mapping/create, merge/split gaps, aliases, photo moderation, spam Fit Report/submission handling, field lock/reopen, pending Type conflicts, SerpAPI cache/research/batch/caps, starter-catalog review, retailer/identifier conflicts, responsive admin UX.
20. **Final site-wide regression pass** — mobile/desktop, navigation, privacy, terminology, loading/empty/error states, conditional commerce, stale concepts, cross-page destinations, canonical-data consistency.

# AUDIT COMPLETION RULE

A page/surface is not complete merely because code exists or tests pass.

Completion requires:
1. current source/live behavior inspected;
2. owner interaction review performed;
3. owner-requested corrections made canonically;
4. production behavior verified where applicable;
5. owner explicitly confirms the surface is done;
6. this master status is updated.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK

These are real open items and must not be silently represented as finished:
- barcode scanner owner test;
- Product-to-Product merge tooling;
- audited Product/candidate split tooling;
- complete admin queue/tab UX;
- complete alias management UX;
- complete spam garment-submission/Fit Report moderation;
- complete pending→canonical Product-photo workflow;
- complete field lock/reopen UX;
- admin SerpAPI single/batch research UI, cache indicators and cap handling;
- starter-catalog item-by-item enrichment/review;
- Department consensus/default behavior beyond current evidence foundations;
- material trust/corroboration semantics for same-member multiple report votes;
- universal pending-submission duplicate handling where unresolved submissions repeat before Product resolution;
- browser-level behavioral regression coverage across the major rework;
- the entire owner page-by-page re-audit above;
- historical branch-pointer cleanup remains secondary maintenance and must never replace current product audit work.

# CONDENSED RECOVERY / DEPLOYMENT LEDGER

Preserve as history, not competing current source:
- 2026-08-21 canonical recovery corrected severe source-of-truth drift and established the no-parallel-canon discipline.
- PR #44 preserved optimized Outfit photo processing.
- PR #45 established the public homepage structure that now requires post-rework content re-audit.
- PR #46 repaired grouped navigation/live schema foundations.
- PR #47 consolidated Explore/My Circle/LikeLocker/moderation and submission-first catalog work and was later merged to `main`.
- Subsequent production work on `main` finalized New Fit Report behavior, exact recipe material defaults, Garment Type review routing, distinct Fit Report situation counting, garment-relevant body-state identity, rolling/state reuse behavior, updated/under-review modal copy, and Preferred Fit UI retirement.

Git history contains the detailed old branch/PR chronology. Do not keep obsolete branch-era restrictions as current operating truth.

# EXACT NEXT ACTION — CURRENT

**Start Audit #1: Homepage + complete FAQ.**

Canon reconciliation is complete. The next work is to inspect the current live homepage and every FAQ entry against the reconciled Product Spec/database truth, identify stale/missing/misleading language and UX issues, and present findings for owner decisions before changing the page.

After owner-confirming Homepage + FAQ, proceed to Audit #2: global header/member Menu/admin navigation.

Barcode scanner stays open for future testing and is not the next task.
