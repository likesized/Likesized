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
- Current production behavior commit: `c2fc26233cfbee961ff9e0ea95f4338d1ce641fc` — squash merge of PR #53, **Complete repair batch and Unconfirmed review flow**.
- PR #53 exact-head LikeSized CI run **#684** (`32665608459`) on tested head `47f949d1b4ce057b54b38c4cc2ea00cb6ced94c2` completed successfully before merge: canonical integrity, TypeScript, every focused safeguard suite, production build, fresh replay of every canonical migration and full database behavior/privacy tests.
- The exact tested tree was merged with expected-head SHA protection; production Vercel deployment `dpl_8tpiSJWtNSYzgnKBWzFCByBz6cgg` is **READY** and aliases `likesized.com`.
- Live public sanity confirmed the production deployment is serving the owner-approved homepage/FAQ order/copy, protected routes still enforce authentication, and the deployment had no error/fatal runtime logs during the post-deploy check.
- Authenticated private/member/admin surfaces were not falsely claimed as manually exercised without an authenticated browser session; their current deployed behavior is covered by exact-head application safeguards, production build, full fresh migration replay and database behavior/privacy tests. Owner interaction review remains part of the ordered audits below.
- Applied database migrations are immutable; corrections use later ordered migrations.
- No paid Supabase branches.

## PR #53 production database checkpoint — LIVE
Production Supabase project: `rlksidwniuoxoacumyaf`.

Canonical local migration files and Supabase production ledger versions:
- `supabase/migrations/20260823160000_add_unconfirmed_catalog_status.sql` → production `20260823205559 add_unconfirmed_catalog_status`.
- `supabase/migrations/20260823160100_unconfirmed_identity_and_photo_roles.sql` → production `20260823205714 unconfirmed_identity_and_photo_roles`.
- `supabase/migrations/20260823160200_needs_more_evidence_followup.sql` → production `20260823205746 needs_more_evidence_followup`.

Hosted verification after application confirmed:
- Unconfirmed sorts below Provisional and is candidate-only; the live Product constraint forbids `products.catalog_status='unconfirmed'` and zero live Products were Unconfirmed.
- front/back Fit Photo role storage and uniqueness are live;
- Product Label / Tag evidence table/RLS and owner-scoped storage deletion boundary are live;
- the backward-compatible pending-submission RPC, barcode lookup/confirmation gates, scanner image source, admin resolution boundary, Needs More Evidence owner projection and evidence re-entry RPCs are present;
- existing production evidence was preserved.

Known production evidence preserved through the rollout:
- Maidenform / Heirloom / Bra remains canonical Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25`;
- UPC `196988323504` remains associated with that Product;
- Product identity trust remains **Corroborated** with 2 distinct wearers;
- four Fit Reports remain attached to that Product.

Supabase-assigned versions may differ from local canonical filenames. Never rename applied local migration history to chase hosted timestamps.

## PR #51 production database checkpoint — HISTORICAL / STILL APPLIED
PR #51 migrations remain immutable applied history:
- `supabase/migrations/20260823130000_add_sleepwear_lingerie_category.sql` → production `20260823153830 add_sleepwear_lingerie_category`.
- `supabase/migrations/20260823130100_purchase_context_and_sleepwear_taxonomy.sql` → production `20260823153856 purchase_context_and_sleepwear_taxonomy`.
- `supabase/migrations/20260823140000_add_fit_community_preference.sql` → production `20260823153931 add_fit_community_preference`.
- `supabase/migrations/20260823150000_auto_post_provisional_products_and_item_reporting.sql` → production `20260823154024 auto_post_provisional_products_and_item_reporting`.

## PR #49 / #50 historical production checkpoints
- PR #49 generalized community catalog confidence and deployed as `0b569e4a25b7f75a313e57ca94d79286ec3df1df`; production migration `20260823054933 generalize_catalog_identity_confidence` was applied.
- PR #50 reconciled that production status at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- Later PR #51/#53 behavior supersedes their current-status descriptions but does not rewrite immutable history.

# PR #53 REPAIR BATCH — COMPLETE / DEPLOYED / SANITY CHECKED
The owner completed the post-PR-#51 repair list and explicitly authorized a deployment/sanity-check cycle because the accumulated changes touched several connected surfaces. That authorization froze the batch. The frozen scope was completed and promoted without adding later unrelated requests.

Merged PR #53: **Complete repair batch and Unconfirmed review flow** from `agent/current-repair-batch` → `main`, production behavior commit `c2fc26233cfbee961ff9e0ea95f4338d1ce641fc`.

Owner-approved frozen scope delivered:
1. New Fit Report: removed category helper sentences such as **“Only Bottoms options are shown here.”**; filtered Type lists are sufficient.
2. Account menu: renamed **Fit Profile** to **My Measurements** after onboarding.
3. Kept **Profile Settings** separate.
4. Fit Community Men / Women / Both is asked during first-time Fit Profile setup, then removed from later My Measurements and managed in Profile Settings only.
5. Username follows setup-once / manage-in-Profile-Settings behavior.
6. Scanner matched image is click/tap expandable in an accessible lightbox while preserving Product/catalog-photo → shared Fit Photo → placeholder priority.
7. Manual Item suggestions render as the real dropdown immediately under Item / Style / Model rather than a separate row.
8. Removed the Department helper about preselection; retained the approved Size System helper exactly.
9. Existing Product copy uses **Matched with the LikeSized community** and compact **Change this** controls; corrections create evidence/review rather than direct Product-truth edits.
10. Fit Notes allow 2,000 characters end-to-end, with form counter/validation aligned across initial and later observations.
11. New Fit Report spacing is normalized locally rather than through broad global CSS changes.
12. Homepage order is Hero → distinct **WHAT LIKESIZED DOES** feature band → **THE LOOP** → FAQ, with the three owner-approved selling-point cards.
13. FAQ is cleaned up and includes the community-built catalog explanation plus a dedicated uncertainty explanation.
14. Fit/model evidence supports separate **Front Fit Photo** and **Back Fit Photo** roles.
15. Product identity evidence keeps **Product Photo** and **Product Label / Tag Photo** separate and presents them together in Optional Additional Information.
16. Brand-new manual Item / Style / Model entry remains required. A member may check **I’m not completely sure this is the correct item/style name**; checking opens the identity-help modal for Retail Link, Product Label / Tag Photo and Product Photo. **Save & Continue** populates the same later fields; **I’ll Add This Later** does not create duplicate inputs.
17. Explicit uncertainty creates a pre-publication **Unconfirmed** candidate state below Provisional. Unconfirmed is candidate-only and can never be a live Product status.
18. While Unconfirmed is in active admin review, the member sees no warning/badge/abnormal state. Their Fit Report and Closet item work normally, and they may use the garment in Styles/Outfits. Hidden restriction: it is excluded from shared Product search, suggestions, discovery and unresolved barcode-match suggestions until admin resolution.
19. Active Unconfirmed admin work is prioritized by useful requested identity evidence: Retail/Product webpage, Product Photo, Product Label / Tag Photo. More useful evidence raises the case; zero requested evidence may be impossible to solve and therefore remains low priority within this special queue.
20. If admin cannot reasonably resolve the identity, move it to a separate **Needs More Evidence** bucket so impossible cases do not permanently occupy the active review queue.
21. Only **Needs More Evidence** produces a member-facing notice, and that notice is private to the owner’s personal Closet view. It explains full Closet/Styles use remains available while the item stays absent from other members’ garment searches, and provides **Add More Information**.
22. Add More Information reopens Retail/Product webpage, Product Photo and Product Label / Tag Photo evidence. Previously supplied evidence remains. New evidence automatically returns the candidate to active Needs Review and recalculates its priority.
23. Other members never see the Unconfirmed/Needs More Evidence warning or admin-review state.

The proposed public sex/body-specific measurement FAQ wording remains **PENDING OWNER COPY APPROVAL** and was not part of PR #53.

PR #53 verification/deployment record:
- early PR runs exposed stale safeguards rather than owner-locked product regressions: the old homepage-order expectation, stale Retail Link ownership/review marker expectation, and stale Unconfirmed moderation implementation strings were reconciled to current canonical behavior instead of reverting the product;
- exact-head CI **#684** (`32665608459`) on `47f949d1b4ce057b54b38c4cc2ea00cb6ced94c2` passed every required gate through production build, full fresh migration replay and database behavior/privacy tests;
- PR diff audit showed 23 changed files, all within the frozen batch scope and no patch/temp/parallel implementation line;
- all three PR #53 migrations were applied database-first to production and directly verified against hosted schema/functions/storage/RLS boundaries;
- PR #53 was marked ready and squash-merged only at the exact tested head, producing `c2fc26233cfbee961ff9e0ea95f4338d1ce641fc` on `main`;
- Vercel production `dpl_8tpiSJWtNSYzgnKBWzFCByBz6cgg` reached READY and serves `likesized.com`;
- public homepage/FAQ and unauthenticated protected-route guards passed live sanity; no error/fatal runtime logs were present for the new production deployment during the check;
- authenticated owner/member/admin UI flows still require normal owner/browser interaction during the ordered audits and Foundation Technical Audit; they are not falsely recorded as manually exercised without a session.

# CANONICAL RECOVERY / LINEAGE STATUS
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. PR #43 promoted the verified recovery line to `main`. Normal development must still obey one-source/one-line/no-patch rules.

A 2026-08-23 canonical audit found no alternate current-state schema file and no second live implementation on `main`, but it found stale post-PR-#51 documentation plus a large historical branch namespace. PR #52 reconciled that status before PR #53; this post-PR-#53 reconciliation records the new live production checkpoint without altering product behavior.

# BRANCH / PR CLEANUP LEDGER — AUDITED 2026-08-23
## Cleanup rule
Old branches are not canonical. Before closing/deleting them, their unique work must be classified as RECOVERED, SUPERSEDED, OBSOLETE, DUPLICATE or DEFERRED. Git/closed-PR history preserves old source after branch cleanup.

## PR #36 / `fit-match-engine-audit` — FULLY CLASSIFIED, SAFE TO CLOSE WITHOUT MERGE
The canonical recovery ledger already recovered/resequenced the Fit Match engine, recommendation logic, body-state protections, database migrations and tests from preserved PR #36 head `fcf87fa1782f2ed704a4856c99487900b1445db5`.

Previously deferred files are now resolved:
- `app/closet/closet.module.css` — **SUPERSEDED**. It styles the old private/shared Closet row model. The owner-locked target is one unified public member Closet with owner-only controls layered on the same public content.
- `app/closet/page.tsx` — **SUPERSEDED** as historical source. It explicitly rendered legacy `visibility: private|shared` semantics and therefore cannot override the future unified Closet target. Current repair work may edit the canonical current file without resurrecting that old ownership model.

All remaining PR #36 product meaning is either recovered into `main`, superseded by later owner decisions, or represented as current roadmap work. PR #36 is historical and must not be merged.

## Phase 6.5 preserved branches — FULLY CLASSIFIED
### `phase-6-5-1-navigation-ia`
- grouped navigation intent, persistent bell and useful IA decisions were recovered/adapted into later canonical source;
- old saved-Fit-Twin/Style-Feed ownership semantics were superseded by Following + system-generated Fit Twin;
- placeholder Help/Browse/LikeLocker code and branch-level canonical documents are obsolete/superseded;
- safe to delete after classification/recovery.

### `phase-6-5-2-browse-preview`
- rejected synthetic preview implementation is **OBSOLETE/SUPERSEDED**;
- durable Browse/Explore product decisions were recovered into current canonical docs/later implementation;
- no preview source should be resurrected;
- safe to delete after classification/recovery.

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
- `agent/fit-report-review-purchase-context` — PR #51 merged.
- the PR #52 reconciliation source is represented by merged `main` commit `05f496cbe6cb412681bcd2530f7748aca85db681`.
- `agent/current-repair-batch` — PR #53 merged to production `main` as `c2fc26233cfbee961ff9e0ea95f4338d1ce641fc`; after this reconciliation it has no current product authority and is safe to delete.

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
Historical non-`main` branches classified above have no current product authority. The desired repository branch state is one long-lived canonical branch: `main`; temporary active PR branches are disposable after verified merge.

# OWNER-LOCKED LATEST PRODUCT DECISIONS

## 1. Direct Product search is global
A direct Product search returns matching men's, women's and unisex Products without requiring the member to switch Fit Community or Department first.

Fit Community affects people/wearer relevance. Product Department/taxonomy may narrow an explicit browse/filter context when intentionally selected, but it is not a hidden direct-search gate.

Unresolved **Unconfirmed** and **Needs More Evidence** candidate identities are not live Products and therefore never appear in other members’ direct Product search, suggestions, browse/discovery or unresolved barcode-match suggestions before admin resolution.

## 2. Fit Community — Men / Women / Both
- stored privately on Fit Profile;
- used as a default for People My Size/My Circle social relevance;
- temporary view switching does not rewrite saved preference;
- never changes body Match %;
- belongs to the person/wearer, not the garment Department.

A person remains in their saved Fit Community even when wearing/reviewing a garment sold in a different Department.

Post-onboarding behavior: Fit Community is asked during initial setup, then managed only in Profile Settings; the later body-measurement destination is **My Measurements**.

## 3. Public measurement FAQ copy — PENDING OWNER APPROVAL
The concept may later explain that more accurate measurements improve Match precision and that different body/garment contexts can make certain measurements especially informative. No exact sex/body-specific public wording is approved until owner review.

## 4. Pre-publication Unconfirmed + live Product identity trust
Publishing and trust strength are separate.

- **Unconfirmed — pre-publication candidate only.** Explicit member uncertainty hard-gates automatic publication and requires admin identity resolution. It is below Provisional but can never be stored as a live Product status.
- **Provisional — 1 distinct wearer.** A clean unique first member submission may immediately materialize/map a searchable Product.
- **Corroborated — 2–4 distinct wearers.** Independent wearer evidence strengthens Product identity.
- **Established — 5+ distinct wearers.** The five-wearer milestone remains the stronger community-evidence tier.
- **Verified — authoritative/admin-reviewed only.** Never achieved merely from community count.

Repeated reports by one member do not manufacture distinct-member identity trust. Wearer count does not silently verify unrelated Product facts such as material, description or Department.

Routine unique new garments without an uncertainty/blocking signal must not require admin approval. Unconfirmed is an explicit exception, not a new mandatory intake queue.

## 5. Blocking ambiguity / Unconfirmed stays reviewable
Do not auto-post questionable Product truth when a real blocking signal already exists. Examples include explicit member identity uncertainty, multiple exact Products, identity conflict, credible duplicate evidence, barcode/identifier collision or retailer-link collision tied to another Product.

Explicitly uncertain items remain usable in the submitting member’s Closet and Styles/Outfits while hidden from the shared Product catalog. Admin may map them to an existing Product or create/map a new Product after review; a new Product created from an Unconfirmed candidate starts no stronger than Provisional unless separate authoritative evidence justifies a stronger state.

If an Unconfirmed identity cannot reasonably be resolved, admin moves it to **Needs More Evidence**, outside the active review queue. That is a queue state, not Product truth and not publication.

## 6. Needs More Evidence member follow-up — PRIVATE OWNER VIEW ONLY
Active Unconfirmed review is intentionally invisible to the submitting member: no warning, badge or abnormal state.

Only after admin moves an unresolved Unconfirmed candidate to **Needs More Evidence** does the member see a small disclaimer in their own personal Closet view. It must explain:
- the garment remains fully usable in their Closet and Styles/Outfits;
- it will not appear in garment searches for other members until LikeSized can verify its identity;
- **Add More Information** lets them provide Retail/Product webpage, Product Photo and/or Product Label / Tag Photo evidence.

Previously supplied evidence remains visible/preserved. New evidence automatically returns the candidate to active Needs Review and refreshes priority. This disclaimer/review status is never visible to other members.

## 7. Later reports do not automatically remove Products
An already-posted Product remains usable when later disagreement arrives. Preserve evidence and flag it. Do not automatically delete, unpublish or silently overwrite the Product because one later report conflicts.

## 8. Every published Product has one Report feature
**Report this item** reasons:
- Inappropriate content
- Image doesn't match this Product
- Incorrect Product information
- Something else

A member report creates review evidence; it does not grant direct edit authority.

## 9. Trust/evidence controls flag urgency
For published Products:
- Provisional (1 wearer) flagged issue → **High**.
- Corroborated (2–4 wearers) flagged issue → **High** because a genuine Product problem may still be undiscovered.
- Established (5+ wearers) → one isolated ordinary disagreement starts **Low**; a second independent signal escalates **Medium**; three or more escalate **High**.
- Verified → isolated ordinary report starts **Low**; repeated independent evidence may escalate Medium/High.
- Strong barcode collisions, duplicate evidence or multiple identity conflicts may escalate regardless of tier.

For explicit **Unconfirmed** intake review, requested identity evidence controls work ordering within that exception queue: Retail/Product webpage + Product Photo + Product Label/Tag Photo together are highest; partial evidence is intermediate; no requested evidence is lowest because it may be impossible to resolve. Moving to Needs More Evidence removes the case from the active queue until new member evidence arrives.

Low priority means review later, never discard evidence.

## 10. Internal review signals may find likely duplicates/reassignment
Conservative same-brand/type name similarity, barcodes, retailer links, reviewed aliases and other identity evidence may create review flags. They never authorize fuzzy automatic merge by themselves.

## 11. Scanner confirmation image priority
For **Is this the item?**:
1. Product/catalog photo first.
2. Public/shared member Fit Photo second; Front preferred when front/back both exist.
3. Default/placeholder if neither exists.

A member Fit Photo used as scanner fallback is only identification display evidence; it never becomes canonical Product imagery or Product truth. Unconfirmed candidates are excluded from unresolved scanner suggestions until admin resolution.

# NEW FIT REPORT — OWNER LOCKED
Main form order:
1. Brand / Make.
2. Item / Style / Model.
3. Overall Category.
4. Specific Garment Type filtered by Category.
5. optional Department.
6. zero-to-four controlled Type questions; Not sure always last.
7. Color.
8. Size.
9. Overall Fit Result.
10. Condition.
11. optional Front Fit Photo and optional Back Fit Photo.
12. optional Fit Notes, up to 2,000 characters.
13. optional Retail Link.

Item / Style / Model remains required for a new item. Do not provide a generic blank **No model** escape. Helper copy explains that the member should enter the specific item/style/model shown on the garment, tag, packaging or retailer listing; examples do not repeat the Brand field.

For brand-new manual entry only, the member may check **I’m not completely sure this is the correct item/style name**. Checking opens the identity-help modal immediately with:
- Retail Link;
- Product Label / Tag Photo;
- Product Photo.

**Save & Continue** commits those values into the same underlying later form fields; it must never create duplicate evidence fields. **I’ll Add This Later** closes the modal while preserving the Unconfirmed signal.

Retail Link remains reusable Product/retailer identity evidence rather than purchase context.

## Optional Additional Information
Collapsed by default, exact order:
1. Purchased From.
2. Price Paid.
3. Purchase Method — Online / In Store / Received as a Gift.
4. Approx. Purchase Date — Month + Year.
5. UPC / barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo + Product Label / Tag Photo displayed together as separate evidence roles.

Product Label / Tag Photo is identity-review evidence and never becomes Product-display imagery merely because it exists.

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

Unconfirmed does not change that base identity rule; it records that the member does not trust the Item / Style / Model text enough for automatic publication. The required typed text remains evidence while admin investigates.

Barcode confidence remains separate:
- first distinct member association to known Product = provisional Product→barcode evidence;
- second distinct member with corresponding Product Fit Report evidence = corroborated relationship;
- one Product may have multiple legitimate barcodes;
- one barcode credibly supporting competing Products is flagged and never silently reassigned;
- unresolved Unconfirmed/Needs More Evidence candidates are not offered as barcode matches to other members.

Scanner recognition remains LikeSized-local and pauses on **Is this the item?** for a unique recognized identity. Physical questions stay in the Fit Report.

# OWNER-LOCKED FIT REPORT EVIDENCE RULES
For a resolved Product, one counted Fit Report represents Member + exact Product + normalized Size + objective physical-answer fingerprint + garment-relevant body state.

Fit Result, Intended Fit, Condition, Color, Material, retailer URL, barcode, Department, Notes, Product Photo, Product Label / Tag Photo, Fit Photo and purchase context do not independently create another counted report.

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

The PR #53 Unconfirmed follow-up is a narrow owner-only exception layered onto the current Closet, not a second Closet system: active Unconfirmed review is invisible; Needs More Evidence shows only the private owner disclaimer and Add More Information evidence workflow. It must not expose admin state on another member’s view and must not block normal Closet/Style use.

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
1. Homepage + FAQ — PR #53 production behavior is live and public sanity passed; measurement-specific sex/body FAQ wording remains pending owner approval.
2. Global header + member Menu + admin entry/navigation — PR #53 contains live **My Measurements** naming; broader owner interaction audit remains.
3. Auth — owner confirmed.
4. Fit Profile / My Measurements — PR #53 keeps Fit Community in onboarding but removes post-onboarding editing from My Measurements; production code/database is live, owner interaction audit remains.
5. Profile Settings — PR #53 makes this the sole post-onboarding Fit Community editor and retains username management; production code/database is live, owner interaction audit remains.
6. Notifications — unfinished audit after Foundation Technical Audit.
7. Unified Closet/member profile Closet — PR #53 adds the narrow private Needs More Evidence owner-only follow-up and front/back Fit Photo compatibility; full legacy private/shared cleanup and lifecycle model still remain for the ordered Closet audit.
8. Update/Edit Fit Report only within settled Closet mutation model — PR #53 aligns later Fit Notes to 2,000 characters and preserves unresolved garment identity snapshots; full lifecycle/mutation audit remains.
9. People My Size — Fit Community implemented; full audit remains.
10. My Circle / Following / Fit Twin — Fit Community implemented; full audit remains.
11. New Fit Report — PR #53 production code/database is live with Item / Style / Model uncertainty modal, front/back Fit Photos, Product/Label evidence separation and Unconfirmed creation; authenticated owner interaction audit remains.
11A. **Garment-question variation classification audit** — classify every structured question as variation-defining / descriptive-only / cosmetic; Size and Color excluded absolutely. Do not implement Product Detail Exact Variation until this is settled.
12. New Outfit — Unconfirmed/Needs More Evidence garments remain usable as owner garments; no special public review badge.
13. Outfits / Style Feed — same rule: unresolved review state must not leak to viewers.
14. Garment/Product detail — Report this item is live; full detail audit later must implement locked Exact Variation / Body Match / Fit Result / lifecycle evidence presentation above.
15. Explore.
16. Search + `/browse` compatibility — direct global Product search remains locked; unresolved Unconfirmed/Needs More Evidence candidates must never leak into other members’ Product discovery or barcode suggestions.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation — PR #53 adds live evidence-prioritized active Unconfirmed review and a separate Needs More Evidence bucket; full all-Products/filter/merge/split tooling still remains for later ordered audit.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# FOUNDATION TECHNICAL AUDIT — REQUIRED BEFORE ROADMAP RESUMES
PR #53 is deployed and post-deploy sanity/hosted-schema verification is complete. Conduct this dedicated technical audit before continuing normal roadmap implementation.

Audit foundational systems touched by recent changes:
- Product identity boundaries and candidate→Product materialization;
- Unconfirmed candidate-only gating and admin-reviewed transition to an existing Product or new Provisional Product;
- Needs More Evidence parking/re-entry semantics and evidence-priority recalculation;
- owner-only status projection and proof that review warnings cannot leak to other members;
- Provisional / Corroborated / Established / Verified trust refresh;
- Product reporting, conflict accumulation and priority recalculation;
- Product-to-barcode confidence and scanner resolution/image fallback, including Unconfirmed exclusion and Front Fit Photo preference;
- Product Photo versus Product Label/Tag evidence privacy/storage/display boundaries;
- Fit Report counted identity, objective fingerprints and body-state compatibility;
- front/back Fit Photo uniqueness and legacy-single-photo compatibility;
- Exact Variant recommendation/evidence foundations versus the locked variation-definition rules;
- garment taxonomy and attribute storage;
- Fit Community filtering versus Match math and Product Department;
- global direct Product search and candidate leakage boundaries;
- purchase-context isolation;
- migration replay, RLS, privacy and authorization boundaries;
- any recommendation or admin behavior indirectly affected by PR #49/#51/#53 foundation changes.

This technical audit is not permission to jump ahead and build Product Detail. It is a foundation-integrity checkpoint.

# ADMIN CATALOG / EVIDENCE TARGET
Admin all-Products/candidate tooling must expose identity-trust tier, distinct confirming-member count, open flag count/reasons, priority, barcode confidence, retailer links, Product Photo/Label evidence history and resolution provenance.

Required views/filters ultimately include Needs Review, **Needs More Evidence**, Provisional, Corroborated, Established, Verified, Has Conflicts and priority.

For Unconfirmed identity-review work, prioritize evidence-rich cases and allow unresolved impossible cases to be parked in Needs More Evidence. Member-added follow-up evidence must return the candidate to active review automatically.

Admin workload is exception-driven. Do not recreate a mandatory review queue for every clean new garment.

# RETAIL / PURCHASE METRICS — OWNER LOCKED
Purchase reporting must preserve denominators: eligible Fit Reports, response count/rate, retailer observations among responders, Online/In Store/Gift distribution, useful price distributions, month/year trends and retailer demand/catalog gaps.

One counted Fit Report contributes at most one acquisition observation. Reprocessing cannot multiply metrics.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# PREFERRED FIT — RETIRED
Member-level Preferred Fit by garment type is not current V1 behavior. Legacy database structures may remain inert. Per-report Intended Fit is separate metadata.

# BETA / POST-BETA DIRECTION
Before Beta finish ordered member-facing audits/reusable components, minimum exception-driven Admin Catalog/Moderation, useful starter catalog coverage, retailer/Shop behavior, denominator-aware purchase reporting, and mobile/desktop/browser/privacy/RLS/security/performance/spam/canonical-drift regression.

During Beta watch direct Product hit rate/manual intake, Unconfirmed resolution/Needs More Evidence re-entry rates, Provisional→Corroborated→Established progression, Product-report/duplicate false-positive rates, barcode learning/conflicts, Fit Report friction, purchase response rates and People My Size usefulness.

Post-Beta: review Mobile App Options + AI Build Viability before approving a separate mobile codebase; expand Gift/public/email wishlist behavior; refine affiliate optimization without changing shopper relevance; expand admin research/catalog tooling where useful.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- PR #53 is production-complete; this reconciliation records the deployed state without changing product behavior.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review and was not part of the frozen batch.
- PR #53 adds practical Unconfirmed/Needs More Evidence queue behavior, but full Admin all-Products priority/filter/merge/split presentation remains for the ordered Admin audit.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open beyond the narrow owner-only Needs More Evidence follow-up.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX, starter-catalog enrichment and authenticated browser regression remain open where previously scoped.
- Variation-definition audit (#11A) must be completed before Product Detail Exact Variation UI uses controlled questions as tracked variations.
- Foundation Technical Audit is the required next integrity checkpoint before normal roadmap implementation resumes.
- Branch cleanup is authorized by the classification ledger above; the desired long-lived branch state is `main` only after active reconciliation work is merged and verified.
- `main` is currently not branch-protected. This is not a current repository-rule violation, but enabling required PR + CI protection is a separate owner decision and must not be changed silently.

# CONDENSED DEPLOYMENT / RECOVERY LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line and PR #43 promoted it.
- PR #44 optimized canonical Outfit photo storage pipeline.
- PR #45 restored/reordered public homepage content and FAQ.
- PR #46 repaired live Fit Profile schema and grouped navigation.
- PR #47 rebuilt Explore/My Circle/LikeLocker/moderation foundations against real data.
- PR #49 generalized catalog identity confidence; production migration `20260823054933` applied.
- PR #50 recorded that production state at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 merged at `93d9414a29f81b5732c42bf277cc085db5e93998`; exact-head CI #668 passed; four ordered migrations were applied in production; Vercel `dpl_AXBaKS6TRWxUv81kKFYULYT22AFu` reached READY on `likesized.com`.
- PR #52 merged documentation/status reconciliation to `main` at `05f496cbe6cb412681bcd2530f7748aca85db681`.
- PR #53 exact-head CI #684 passed all application/build/fresh-migration/database gates; hosted migrations `20260823205559`, `20260823205714`, `20260823205746` were applied/verified database-first; exact tested head was squash-merged to `main` as `c2fc26233cfbee961ff9e0ea95f4338d1ce641fc`; Vercel production `dpl_8tpiSJWtNSYzgnKBWzFCByBz6cgg` is READY on `likesized.com`; public/auth-guard/runtime sanity passed.

# EXACT NEXT ACTION — CURRENT
1. Complete this docs-only post-PR-#53 production reconciliation through exact-head CI and merge; do not alter product code or applied migrations.
2. Conduct the **Foundation Technical Audit** above against production behavior commit `c2fc26233cfbee961ff9e0ea95f4338d1ce641fc` and the hosted PR #53 database state.
3. Prioritize Product/candidate materialization, Unconfirmed/Needs More Evidence ownership/privacy, barcode/image fallback, front/back Fit Photos, Product-vs-Label evidence boundaries, trust refresh, Fit Report/body-state identity, RLS and migration replay.
4. Record audit findings/debt canonically in this master and `supabase/schema_contract.md`; fix underlying issues in one active line only if the audit finds real defects. Do not jump ahead to Product Detail/Exact Variation implementation.
5. After the Foundation Technical Audit is resolved/recorded, resume the ordered owner audits/roadmap in sequence under a separately authorized development/deployment batch.