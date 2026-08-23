# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current status record, owner-decision ledger, implementation-debt ledger, deployment checkpoint, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Do not add later requests into that batch. Any request made after deployment authorization starts the next change list and waits for a separate deployment instruction.

This rule exists to keep production batches small enough for owner review and to prevent unrelated late changes from breaking already-approved work.

# CURRENT STATUS — 2026-08-23

## Canonical production line — LIVE
- `main` is the one production implementation line and is coupled to Vercel production.
- Current production commit: `93d9414a29f81b5732c42bf277cc085db5e93998` — merge of PR #51, **Finalize Fit Report flow, member relevance, and catalog trust**.
- PR #51 exact-head LikeSized CI run **#668** (`32648986342`) completed successfully before merge: canonical integrity, TypeScript, focused safeguards, production build, fresh replay of every canonical migration and full database behavior/privacy tests.
- Vercel production deployment `dpl_AXBaKS6TRWxUv81kKFYULYT22AFu` is READY and aliases `likesized.com`.
- Applied database migrations are immutable; corrections use later ordered migrations.
- No paid Supabase branches.

## PR #51 production database checkpoint — LIVE
Production Supabase project: `rlksidwniuoxoacumyaf`.

Canonical local migration files and their Supabase production ledger versions:
- `supabase/migrations/20260823130000_add_sleepwear_lingerie_category.sql` → production `20260823153830 add_sleepwear_lingerie_category`.
- `supabase/migrations/20260823130100_purchase_context_and_sleepwear_taxonomy.sql` → production `20260823153856 purchase_context_and_sleepwear_taxonomy`.
- `supabase/migrations/20260823140000_add_fit_community_preference.sql` → production `20260823153931 add_fit_community_preference`.
- `supabase/migrations/20260823150000_auto_post_provisional_products_and_item_reporting.sql` → production `20260823154024 auto_post_provisional_products_and_item_reporting`.

Supabase-assigned versions may differ from local canonical filenames. Never rename applied local migration history to chase hosted timestamps.

Known production evidence preserved through the materialization/backfill:
- Maidenform / Heirloom / Bra is canonical Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25`;
- UPC `196988323504`;
- Product identity trust is **Corroborated** with 2 distinct wearers;
- catalog review is not required for that clean item;
- four Fit Reports currently exist across those two wearers;
- the item has a shared Fit Photo and no Product photo, making it a useful scanner fallback test case.

## PR #49 / #50 historical production checkpoints
- PR #49 generalized community catalog confidence and deployed as `0b569e4a25b7f75a313e57ca94d79286ec3df1df`; production migration `20260823054933 generalize_catalog_identity_confidence` was applied.
- PR #50 reconciled that production status at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 supersedes their pre-PR-#51 status descriptions but does not rewrite their immutable history.

# CURRENT OWNER REVIEW / NEXT CHANGE LIST — NOT YET DEPLOYED
The owner is actively reviewing the PR #51 production surfaces and is keeping a single repair list. Do not interrupt that review by silently adding new implementation work.

Already owner-approved items for the next repair list:
1. New Fit Report: remove the category helper sentence such as **“Only Bottoms options are shown here.”** for every category; the filtered Type list is sufficient.
2. Account menu: rename **Fit Profile** to **My Measurements** after onboarding so the member-facing destination is clearly body-measurement focused.
3. Keep **Profile Settings** as a separate destination.
4. Fit Community Men / Women / Both is asked during first-time Fit Profile setup, then is removed from the later My Measurements screen and lives in Profile Settings only.
5. Username follows the same setup-once / manage-in-Profile-Settings pattern.

These items are not part of the completed PR #51 deployment. They belong to the next owner-reviewed repair batch and must not be pushed until the owner supplies/finishes that batch and authorizes deployment.

The proposed new sex/body-specific measurement FAQ concept remains **PENDING OWNER COPY APPROVAL**. Do not publish wording until the exact text is reviewed.

# CANONICAL RECOVERY / LINEAGE STATUS
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. PR #43 promoted the verified recovery line to `main`. Normal development must still obey one-source/one-line/no-patch rules.

A 2026-08-23 canonical audit found no alternate current-state schema file and no second live implementation on `main`, but it found stale post-PR-#51 documentation plus a large historical branch namespace. This reconciliation records the final status before branch cleanup.

# BRANCH / PR CLEANUP LEDGER — AUDITED 2026-08-23
## Cleanup rule
Old branches are not canonical. Before closing/deleting them, their unique work must be classified as RECOVERED, SUPERSEDED, OBSOLETE, DUPLICATE or DEFERRED. Git/closed-PR history preserves old source after branch cleanup.

## PR #36 / `fit-match-engine-audit` — FULLY CLASSIFIED, SAFE TO CLOSE WITHOUT MERGE
The canonical recovery ledger already recovered/resequenced the Fit Match engine, recommendation logic, body-state protections, database migrations and tests from preserved PR #36 head `fcf87fa1782f2ed704a4856c99487900b1445db5`.

Previously deferred files are now resolved:
- `app/closet/closet.module.css` — **SUPERSEDED**. It styles the old private/shared Closet row model. The owner-locked target is one unified public member Closet with owner-only controls layered on the same public content.
- `app/closet/page.tsx` — **SUPERSEDED** as source. It explicitly renders legacy `visibility: private|shared` semantics and therefore cannot be reused as the future unified Closet implementation. The valid idea that bad fits remain useful evidence is already canonical elsewhere.

All remaining PR #36 product meaning is either recovered into `main`, superseded by later owner decisions, or represented as current roadmap work. PR #36 must be **closed, not merged**. Its branch may then be deleted.

## Phase 6.5 preserved branches — FULLY CLASSIFIED
### `phase-6-5-1-navigation-ia`
- grouped navigation intent, persistent bell and useful IA decisions were recovered/adapted into later canonical source;
- old saved-Fit-Twin/Style-Feed ownership semantics were superseded by Following + system-generated Fit Twin;
- placeholder Help/Browse/LikeLocker code and branch-level canonical documents are obsolete/superseded;
- safe to delete after this ledger is merged.

### `phase-6-5-2-browse-preview`
- rejected synthetic preview implementation is **OBSOLETE/SUPERSEDED**;
- durable Browse/Explore product decisions were recovered into current canonical docs/later implementation;
- no preview source should be resurrected;
- safe to delete after this ledger is merged.

## Retail decision branch — FULLY RECOVERED
`owner-decision-retail-affiliate-plan` / closed unmerged PR #48 is docs-only historical work. Its valid owner decisions are already represented in current Product/Shop/retailer rules: zero/one/multiple retailer destinations, clean retailer labels, provider-independent canonical URLs, conditional cart/Shop actions, commission neutrality and the locked affiliate disclosure. Branch is **RECOVERED/SUPERSEDED AS A WHOLE** and safe to delete.

## Measurement-guide repair branch — OBSOLETE
`fix/high-res-measurement-guides` contains a one-time binary rebuild workflow that expected temporary `.binary-upload` chunks and self-deleted after reconstruction. Current `main` already contains the final torso and waist/hip measurement guide assets. The branch-only rebuild workflow is **OBSOLETE** and must not become a permanent alternate asset pipeline. Safe to delete.

## Placeholder branch — OBSOLETE
`phase-6-4-fit-profile-help` contains only `tmp-placeholder.txt` beyond its old base. It is **OBSOLETE** and safe to delete.

## Merged Phase 6.4 branches — RECOVERED THROUGH THEIR MERGED PRS
The following branches are historical heads of merged owner-reviewed PRs; their durable source is already in `main` and later canonical evolution. Safe to delete:
- `phase-6-4-measurement-audit-outfits-roadmap` — PR #37 merged.
- `phase-6-4-fit-profile-resave-username-settings` — PR #38 merged.
- `phase-6-4-mobile-revisit-review-removals` — PR #39 merged.
- `phase-6-4-review-grid-scroll-top` — PR #40 merged.
- `phase-6-4-settings-mobile-alert-layout` — PR #42 merged; abandoned PR #41 carried no durable separate implementation.
- `phase-6-4-mobile-menu` — PR #33 merged.
- `phase-6-4-mobile-menu-state` — PR #34 merged.
- `phase-6-4-mobile-menu-outside-click` — PR #35 merged.
- `repair-menu-and-live-fit-profile` — PR #46 merged.
- `correct-grouped-menu-layout` — PR #47 merged.
- `fix-public-homepage-content` — PR #45 merged.
- `optimize-outfit-photo-pipeline` — PR #44 merged.

## Recovery / production branches already merged — RECOVERED
Safe to delete because the canonical result is already in `main`:
- `canonical-recovery-2026-08-21` — PR #43 merged.
- `agent/catalog-evidence-confidence` — PR #49 merged.
- `agent/post-deploy-canonical-status` — PR #50 merged.
- `agent/fit-report-review-purchase-context` — PR #51 merged; branch has no unique file difference from the merged source tree.

## Historical verification/checkpoint branches — OBSOLETE OR DUPLICATE
These branches existed to trigger/check CI or preserve temporary verification markers. Their substantive product source is already in later `main`; marker-only/empty verification commits are not product source. Safe to delete:
- `agent/phase-0-replay-verification`
- `agent/phase-1-2-verification`
- `agent/phase-1-3-verification`
- `agent/phase-1-4-verification`
- `agent/phase-1-5-verification`
- `agent/phase-1-5-verification-2`
- `agent/phase-1-5-verification-3`
- `agent/phase-2-1-verification`
- `agent/phase-2-final-verification`
- `agent/phase-2-recalculation-verification`
- `agent/phase-3-1-verification`
- `agent/phase-3-3-verification`
- `agent/phase-3-4-verification`
- `agent/phase-3-5-verification`
- `agent/phase-4-1-verification`
- `agent/phase-4-2-verification`
- `agent/phase-4-3-verification`
- `agent/phase-4-4-verification`
- `agent/phase-4-5-verification`
- `agent/phase-5-1-verification`
- `agent/phase-5-2-foundation-verification`
- `agent/phase-5-2-foundation-verification-2`
- `agent/phase-5-2-ui-verification`
- `agent/phase-5-3-complete-verification`
- `agent/phase-5-3-notification-foundation`
- `agent/phase-5-4-social-verification`
- `agent/phase-5-5-search-verification`
- `agent/phase-5-5-search-verification-2`
- `agent/phase-6-1-2-verification`
- `agent/phase-6-1-2-verification-2`
- `agent/phase-6-1-2-verification-3`
- `agent/phase-6-1-2-verification-final`
- `agent/phase-6-1-prototype-removal`

## Old feature/experiment branches fully behind or superseded by later `main`
These are not canonical and carry no current product authority. Their durable implementation has been merged/replaced later or their old branch head is strictly behind current `main`. Safe to delete:
- `FINAL-NO`
- `NO-MORE`
- `STOP-TEST`
- `THIS-IS-BAD`
- `agent/canonicalize-migration-version`
- `auth-supabase`
- `closet-live`
- `fit-profile-persistence`
- `fit-twins`
- `outfits-live`
- `people-live-matches`
- `product-fit-live`
- `search-discovery`
- `phase-6-4-diagram-assets`
- `phase-6-4-diagram-assets-check`
- `phase-6-4-diagram-assets-check2`

## Cleanup target
After this reconciliation is merged and PR #36 is closed, all historical non-`main` branches above are authorized for deletion. The temporary reconciliation branch itself is also disposable after merge. The desired repository branch state is one long-lived canonical branch: `main`.

# OWNER-LOCKED LATEST PRODUCT DECISIONS

## 1. Direct Product search is global
A direct Product search returns matching men's, women's and unisex Products without requiring the member to switch Fit Community or Department first.

Fit Community affects people/wearer relevance. Product Department/taxonomy may narrow an explicit browse/filter context when intentionally selected, but it is not a hidden direct-search gate.

## 2. Fit Community — Men / Women / Both
- stored privately on Fit Profile;
- used as a default for People My Size/My Circle social relevance;
- temporary view switching does not rewrite saved preference;
- never changes body Match %;
- belongs to the person/wearer, not the garment Department.

A person remains in their saved Fit Community even when wearing/reviewing a garment sold in a different Department.

Post-onboarding UI direction for the next repair batch: Fit Community is asked during initial setup, then managed only in Profile Settings; the later body-measurement destination is **My Measurements**.

## 3. Public measurement FAQ copy — PENDING OWNER APPROVAL
The concept may later explain that more accurate measurements improve Match precision and that different body/garment contexts can make certain measurements especially informative. No exact sex/body-specific public wording is approved until owner review.

## 4. Clean first-time items auto-post + four identity-trust tiers
Routine unique new garments must not require admin approval. Publishing and trust strength are separate.

- **Provisional — 1 distinct wearer.** A clean unique first member submission may immediately materialize/map a searchable Product.
- **Corroborated — 2–4 distinct wearers.** Independent wearer evidence strengthens Product identity.
- **Established — 5+ distinct wearers.** The five-wearer milestone remains the stronger community-evidence tier.
- **Verified — authoritative/admin-reviewed only.** Never achieved merely from community count.

Repeated reports by one member do not manufacture distinct-member identity trust. Wearer count does not silently verify unrelated Product facts such as material, description or Department.

## 5. Blocking ambiguity stays reviewable
Do not auto-post questionable Product truth when a real blocking signal already exists. Examples include multiple exact Products, identity conflict, credible duplicate evidence, barcode/identifier collision or retailer-link collision tied to another Product.

Such cases remain unresolved/Needs Review. Clean candidates are normal auto-post; unresolved candidates are the exception.

## 6. Later reports do not automatically remove Products
An already-posted Product remains usable when later disagreement arrives. Preserve evidence and flag it. Do not automatically delete, unpublish or silently overwrite the Product because one later report conflicts.

## 7. Every published Product has one Report feature
**Report this item** reasons:
- Inappropriate content
- Image doesn't match this Product
- Incorrect Product information
- Something else

A member report creates review evidence; it does not grant direct edit authority.

## 8. Four-tier trust controls initial flag urgency
- Provisional (1 wearer) flagged issue → **High**.
- Corroborated (2–4 wearers) flagged issue → **High** because a genuine Product problem may still be undiscovered.
- Established (5+ wearers) → one isolated ordinary disagreement starts **Low** because an individual entry error is more likely after substantial agreement; a second independent signal escalates **Medium**; three or more escalate **High**.
- Verified → isolated ordinary report starts **Low**; repeated independent evidence may escalate Medium/High.
- Strong barcode collisions, duplicate evidence or multiple identity conflicts may escalate regardless of tier.

Low priority means review later, never discard evidence.

## 9. Internal review signals may find likely duplicates/reassignment
Conservative same-brand/type name similarity, barcodes, retailer links, reviewed aliases and other identity evidence may create review flags. They never authorize fuzzy automatic merge by themselves.

## 10. Scanner confirmation image priority
For **Is this the item?**:
1. Product/catalog photo first.
2. Public/shared member Fit Photo second.
3. Default/placeholder if neither exists.

A member Fit Photo used as scanner fallback is only identification display evidence; it never becomes canonical Product imagery or Product truth.

# NEW FIT REPORT — OWNER LOCKED
Main form order:
1. Brand / Make.
2. Item / Model.
3. Overall Category.
4. Specific Garment Type filtered by Category.
5. optional Department.
6. zero-to-four controlled Type questions; Not sure always last.
7. Color.
8. Size.
9. Overall Fit Result.
10. Condition.
11. optional Fit Photo.
12. optional Fit Notes.
13. optional Retail Link.

Retail Link remains reusable Product/retailer evidence rather than purchase context.

## Optional Additional Information
Collapsed by default, exact order:
1. Purchased From.
2. Price Paid.
3. Purchase Method — Online / In Store / Received as a Gift.
4. Approx. Purchase Date — Month + Year.
5. UPC / barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo.

Purchase context is one member's acquisition observation keyed to the Fit Report. It is not Product truth, does not inherit from another member, does not create retailer listings and does not affect Match/recommendation/Product identity trust.

## Final confirmation
Before any write, valid form data opens **Does this look right?**. It reviews main Fit Report details only and intentionally excludes Optional Additional Information.

Actions: **Go Back & Edit** and **Confirm Fit Report**.

# SLEEPWEAR & LINGERIE — OWNER LOCKED
Top-level category **Sleepwear & Lingerie** contains Pajama pants, Pajama shorts, Pajama set, Nightgown, Robe, Chemise, Babydoll, Teddy, Corset & bustier and Costume lingerie.

Sleep Shirt is intentionally absent. Sweatpants remains Bottoms. Bra, Bralette, Sports Bra, Underwear and Shapewear remain Intimates. Each controlled Type uses no more than four questions and automatic final Not sure.

Pajama set uses the printed whole-set size unless pieces are genuinely separate Products. Costume lingerie uses Garment form, Top style, Bottom style and Structure / Support; Closure is intentionally omitted.

# PRODUCT IDENTITY / BARCODE CONFIDENCE — OWNER LOCKED
Product identity is centered on normalized Brand + Item + Garment Type. Size, Color, retailer link, legitimate alternate barcode, Fit Result, Material, Condition, Notes, purchase context and report-scoped physical questions do not independently define base Product identity.

Barcode confidence remains separate:
- first distinct member association to known Product = provisional Product→barcode evidence;
- second distinct member with corresponding Product Fit Report evidence = corroborated relationship;
- one Product may have multiple legitimate barcodes;
- one barcode credibly supporting competing Products is flagged and never silently reassigned.

Scanner recognition remains LikeSized-local and pauses on **Is this the item?** for a unique recognized identity. Physical questions stay in the Fit Report.

# OWNER-LOCKED FIT REPORT EVIDENCE RULES
For a resolved Product, one counted Fit Report represents Member + exact Product + normalized Size + objective physical-answer fingerprint + garment-relevant body state.

Fit Result, Intended Fit, Condition, Color, Material, retailer URL, barcode, Department, Notes, Product Photo, Fit Photo and purchase context do not independently create another counted report.

Use `private.product_match_measurements(product_id)` as the shared Product relevance map. Established relevant measurement values split state at a symmetric 2% change threshold. Blank→filled can enrich; blanking a value does not erase established evidence. Original try-on Fit Profile version stays immutable.

There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.

# GARMENT VARIATION IDENTITY / PRODUCT-DETAIL EVIDENCE — ROADMAP LOCK
Do not implement this ahead of the ordered audit. This section defines future Product Detail evidence meaning and the prerequisite New Fit Report question-classification audit.

## Base Product vs variation vs report identity
Keep these distinct:
1. **Product identity** — normalized Brand + Item + Garment Type.
2. **Tracked fit variation** — only explicitly approved variation-defining answers from structured questions LikeSized actually asks for that Garment Type.
3. **Counted Fit Report identity** — Member + exact Product + normalized Size + objective physical-answer fingerprint + compatible garment-relevant body state.
4. **Body Match** — how similar the viewer's relevant body measurements are to the wearer; not garment-fit probability.
5. **Fit outcome** — the size worn plus Fit Result and later lifecycle evidence.

Absolute variation rules:
- **Size never defines a tracked garment variation.** Size stays attached to the Fit Report.
- **Color never defines a tracked garment variation.** Color is cosmetic for variation identity.
- Do not assume every one of a Garment Type's up-to-four controlled questions is variation-defining.

## Required prerequisite audit — roadmap item 11A
Before Product Detail consumes Exact Variation, audit every current Garment Type question and classify it as:
- **Variation-defining** — a meaningful physical garment difference capable of materially changing fit evidence;
- **Descriptive-only** — useful metadata/filter context but not a separate fit-evidence variation;
- **Cosmetic/ignored** — does not define fit variation.

Produce one canonical variation-definition map shared by Product Detail, recommendation/evidence aggregation and future Admin tooling. Do not create parallel variation logic.

## Product Detail default evidence behavior — roadmap item 14
When Product Detail is reached:
- **Primary/default:** closest Body Match for the exact variation being viewed, always first regardless of whether a related variation has a higher Body Match.
- Under an exact-variation result when appropriate, explain: **“This is the closest Fit Report we currently have for this exact variation. A lower Body Match does not mean this item will not fit you — it means we do not yet have a report from someone closer to your measurements.”**
- When enough strong Body Match reports exist for that same exact variation, a compact **Strong Fit Reports** aggregate may summarize sizes worn + Fit Results underneath the closest individual report. Never mix related variations into that aggregate.
- **Secondary/default:** only the single closest Body Match from related approved variations. Show what they wore and state the actual relevant difference such as different cut, rise, dress length, sleeve length, neckline, crop or leg cut.
- **See more evidence** opens all garment-family evidence: exact + related variations, Body Match, sizes worn, Fit Results, variation attributes/differences, aggregates and underlying individual reports.

Body Match terminology must not imply garment probability. If helper copy is needed: **“Body Match shows how closely your measurements match the person who submitted this Fit Report — not how likely the garment is to fit you.”**

High Body Match plus a poor Fit Result remains high body-similarity evidence but poor size/outcome evidence. Recommendation interpretation may degrade a size because of Too Small/Too Big outcomes without reducing Body Match itself.

Later shrinkage, stretching, alteration and Kept/Returned/Exchanged observations belong to dated lifecycle evidence after Closet lifecycle storage is settled. They may affect recommendation confidence/warnings but never rewrite the original try-on Fit Report.

Do not collapse Body Match, variation equality, size worn, Fit Result and lifecycle evidence into one artificial fit percentage.

# CLOSET / POST-SUBMIT MUTATION — OWNER DIRECTION
Owner target is one public member Closet, not separate My Closet and Shared Closet systems. Self view adds owner-only controls to the same public garment/Fit Report content. Raw body data remains private.

Legacy `closet_items.visibility` and private/shared implementation are debt to remove/neutralize during Closet audit.

Original confirmed Fit Report evidence should not become an unrestricted rewrite surface. Closet audit must settle immutable fields, add-missing enrichment, preserved-history corrections and dated lifecycle observations. Kept / Returned / Exchanged and after-use shrink/stretch belong to later lifecycle observations rather than silent rewrites.

# FOLLOWING / FIT TWIN / NOTIFICATIONS — OWNER LOCKED
- Following is member-controlled.
- Fit Twin is **system-generated** from strong current-person Match among followed members.
- one `follows` graph only.
- `/following` resolves to `/circle`.
- signed-in `/` uses My Circle.
- Follow alone does not enable notifications.
- person bell and Product bell are separate systems.

# PRODUCT ACTIONS / LIKELOCKER / SHOP — OWNER LOCKED
- Heart → Like Locker.
- Shooting star → Wish Locker.
- Product bell → one-shot future qualifying Product Match notification.
- Cart → Shop only when valid retailer destination exists.

No action silently triggers another. One valid Shop listing routes direct; multiple show a picker; zero hides Shop. Commission never affects Match, recommendation, Product identity, search rank or retailer choice.

# SERPAPI — ADMIN RESEARCH ONLY
SerpAPI is never ordinary member intake or Product authority. Admin research checks cache, dedupes, respects caps, preserves evidence and requires explicit resolution. Raw external results never write directly into Product truth.

# OWNER RE-AUDIT STATUS / ORDER
A surface is not complete merely because code exists. Completion requires current/live inspection, owner interaction, corrections, production verification, owner confirmation and this master update.

Current order:
1. Homepage + FAQ — PR #51 routing/approved copy live; owner reviewing production; measurement-specific FAQ wording pending owner approval.
2. Global header + member Menu + admin entry/navigation — owner review in progress; next repair batch includes **My Measurements** menu naming.
3. Auth — owner confirmed.
4. Fit Profile / future My Measurements — PR #51 Fit Community + username/mobile corrections are live; owner review in progress; next repair batch moves post-onboarding Fit Community out of this surface.
5. Profile Settings — Fit Community is live; next repair batch makes this the sole post-onboarding Fit Community editor and retains username management here.
6. Notifications — unfinished audit.
7. Unified Closet/member profile Closet — remove legacy private/shared meaning and settle mutation/lifecycle model.
8. Update/Edit Fit Report only within settled Closet mutation model.
9. People My Size — Fit Community implemented; full audit remains.
10. My Circle / Following / Fit Twin — Fit Community implemented; full audit remains.
11. New Fit Report — PR #51 flow live and under owner review.
11A. **Garment-question variation classification audit** — classify every structured question as variation-defining / descriptive-only / cosmetic; Size and Color excluded absolutely. Do not implement Product Detail Exact Variation until this is settled.
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — Report this item is live; full detail audit later must implement the locked Exact Variation / Body Match / Fit Result / lifecycle evidence presentation above.
15. Explore.
16. Search + `/browse` compatibility — direct global Product search rule live/locked.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation — priority/filter/queue UX still needs completion beyond backend scoring; future variation map must be inspectable without turning Size/Color into variation identity.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# FOUNDATION TECHNICAL AUDIT — REQUIRED BEFORE ROADMAP RESUMES AFTER OWNER REPAIR BATCH
After the owner finishes the current production review and the resulting repair batch is deployed/verified, conduct a dedicated technical audit before continuing normal roadmap implementation.

Audit foundational systems touched by the recent changes:
- Product identity boundaries and candidate→Product materialization;
- Provisional / Corroborated / Established / Verified trust refresh;
- Product reporting, conflict accumulation and priority recalculation;
- Product-to-barcode confidence and scanner resolution/image fallback;
- Fit Report counted identity, objective fingerprints and body-state compatibility;
- Exact Variant recommendation/evidence foundations versus the newly locked variation-definition rules;
- garment taxonomy and attribute storage;
- Fit Community filtering versus Match math and Product Department;
- global direct Product search;
- purchase-context isolation;
- migration replay, RLS, privacy and authorization boundaries;
- any recommendation or admin behavior indirectly affected by PR #49/#51 foundation changes.

This technical audit is not permission to jump ahead and build Product Detail. It is a foundation-integrity checkpoint.

# ADMIN CATALOG / EVIDENCE TARGET
Admin all-Products/candidate tooling must expose identity-trust tier, distinct confirming-member count, open flag count/reasons, priority, barcode confidence, retailer links, evidence history and resolution provenance.

Required views/filters include Needs Review, Provisional, Corroborated, Established, Verified, Has Conflicts and priority.

Admin workload is exception-driven. Do not recreate a mandatory review queue for every clean new garment.

# RETAIL / PURCHASE METRICS — OWNER LOCKED
Purchase reporting must preserve denominators: eligible Fit Reports, response count/rate, retailer observations among responders, Online/In Store/Gift distribution, useful price distributions, month/year trends and retailer demand/catalog gaps.

One counted Fit Report contributes at most one acquisition observation. Reprocessing cannot multiply metrics.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# PREFERRED FIT — RETIRED
Member-level Preferred Fit by garment type is not current V1 behavior. Legacy database structures may remain inert. Per-report Intended Fit is separate metadata.

# BETA / POST-BETA DIRECTION
Before Beta finish ordered member-facing audits/reusable components, minimum exception-driven Admin Catalog/Moderation, useful starter catalog coverage, retailer/Shop behavior, denominator-aware purchase reporting, and mobile/desktop/browser/privacy/RLS/security/performance/spam/canonical-drift regression.

During Beta watch direct Product hit rate/manual intake, Provisional→Corroborated→Established progression, Product-report/duplicate false-positive rates, barcode learning/conflicts, Fit Report friction, purchase response rates and People My Size usefulness.

Post-Beta: review Mobile App Options + AI Build Viability before approving a separate mobile codebase; expand Gift/public/email wishlist behavior; refine affiliate optimization without changing shopper relevance; expand admin research/catalog tooling where useful.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Owner is reviewing the live PR #51 batch and will supply the complete next repair list before another deployment.
- Current next repair list already includes category-helper removal, My Measurements naming and post-onboarding Fit Community relocation to Profile Settings.
- Exact measurement FAQ wording remains pending owner review.
- Admin backend flag priority exists; full all-Products priority/filter presentation remains for Admin audit.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, Product-photo workflow, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX, starter-catalog enrichment and browser regression remain open where previously scoped.
- Variation-definition audit (#11A) must be completed before Product Detail Exact Variation UI uses controlled questions as tracked variations.
- Branch cleanup is authorized by the classification ledger above; the desired long-lived branch state is `main` only.
- `main` is currently not branch-protected. This is not a current repository-rule violation, but enabling required PR + CI protection is a separate owner decision and must not be changed silently.

# CONDENSED DEPLOYMENT / RECOVERY LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line and PR #43 promoted it.
- PR #44 optimized canonical Outfit photo storage pipeline.
- PR #45 restored/reordered public homepage content and FAQ.
- PR #46 repaired live Fit Profile schema and grouped navigation.
- PR #47 rebuilt Explore/My Circle/LikeLocker/moderation foundations against real data.
- PR #49 generalized catalog identity confidence; production migration `20260823054933` applied.
- PR #50 recorded that production state at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 merged at `93d9414a29f81b5732c42bf277cc085db5e93998`; exact-head CI #668 passed; four ordered migrations were applied in production; Vercel `dpl_AXBaKS6TRWxUv81kKFYULYT22AFu` is READY on `likesized.com`.
- 2026-08-23 canonical audit classified all historical branch families and completed PR #36 salvage disposition; destructive cleanup is authorized after this ledger is merged.

# EXACT NEXT ACTION — CURRENT
1. Complete this **documentation/status/branch-ledger reconciliation only**; do not add product behavior.
2. Run exact-head LikeSized CI on the reconciliation branch.
3. After green CI, merge this owner-authorized reconciliation to `main` and verify the resulting Vercel docs-only deployment is READY.
4. Close PR #36 **without merge**.
5. Delete historical non-`main` branches classified above, including the merged reconciliation branch when possible; verify no stale open PR remains.
6. Owner continues live production review and sends the complete repair list.
7. Implement that repair list as the next isolated batch; freeze it when the owner says push/deploy.
8. After owner review/repairs are complete, conduct the Foundation Technical Audit above before resuming Notifications or later roadmap work.