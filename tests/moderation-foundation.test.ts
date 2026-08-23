import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration=readFileSync("supabase/migrations/20260822000129_add_content_moderation.sql","utf8");
const submissionMigration=readFileSync("supabase/migrations/20260822162000_submission_first_catalog_foundation.sql","utf8");
const adminControlsMigration=readFileSync("supabase/migrations/20260822174500_add_admin_catalog_operating_controls.sql","utf8");
const aliasHardeningMigration=readFileSync("supabase/migrations/20260822174600_harden_reviewed_brand_alias_writes.sql","utf8");
const exceptionReviewMigration=readFileSync("supabase/migrations/20260823150000_auto_post_provisional_products_and_item_reporting.sql","utf8");
const page=readFileSync("app/moderation/page.tsx","utf8");
const actions=readFileSync("app/moderation/actions.ts","utf8");
const report=readFileSync("components/ReportContentForm.tsx","utf8");
const itemPage=readFileSync("app/item/[slug]/page.tsx","utf8");
const itemActions=readFileSync("app/item/[slug]/actions.ts","utf8");

test("members report only supported photo content and admins retain an audit",()=>{
 assert.match(migration,/outfit_post.*fit_reference_photo/);
 assert.match(migration,/create table public\.content_reports/);
 assert.match(migration,/create table public\.moderation_actions/);
 assert.match(migration,/private\.is_admin\(\)/);
 assert.match(report,/Nudity or sexual content/);
 assert.match(actions,/storage\.from\("outfit-photos"\)\.remove/);
 assert.match(actions,/storage\.from\("fit-reference-photos"\)\.remove/);
 assert.match(page,/Remove content/);
 assert.match(page,/Reported image is no longer available/);
 assert.match(page,/createSignedUrl/);
 assert.match(actions,/eq\("target_type", report\.target_type\)/);
});

test("canonical Product conflicts remain reviewable and admin decisions stay audited",()=>{
 assert.match(migration,/admin_lock_product_field/);
 assert.match(migration,/catalog_moderation_actions/);
 assert.match(migration,/source_status='verified'/);
 assert.match(migration,/product_description_evidence/);
 assert.match(page,/Conflicting Product facts/);
 assert.match(page,/product_attribute_evidence/);
 assert.match(page,/Choose the correct final value/);
 assert.match(page,/choice\.people/);
 assert.match(page,/Lock decision/);
});

test("clean first-member items auto-post Provisional while flagged ambiguity stays in the existing catalog review graph",()=>{
 assert.match(submissionMigration,/create table public\.catalog_candidates/);
 assert.match(submissionMigration,/create table public\.garment_submissions/);
 assert.match(submissionMigration,/create table public\.catalog_review_flags/);
 assert.match(submissionMigration,/create table public\.catalog_resolution_actions/);
 assert.match(exceptionReviewMigration,/if v_confirmations<1 then return null/);
 assert.match(exceptionReviewMigration,/if v_conflicts>0 then/);
 assert.match(exceptionReviewMigration,/v_product_status:=case when v_confirmations>=2 then 'corroborated'/);
 assert.match(exceptionReviewMigration,/else 'provisional'/);
 assert.match(exceptionReviewMigration,/Automatic community Product post/);
 assert.match(page,/Catalog enrichment/);
 assert.match(page,/Pending catalog candidates/);
 assert.match(page,/Map to an existing canonical Product/);
 assert.match(page,/Create verified Product \+ map/);
 assert.match(actions,/mapCatalogCandidate/);
 assert.match(actions,/createProductFromCandidate/);
});

test("every Product has one multi-purpose report action and trust-aware review priority",()=>{
 assert.match(itemPage,/Report this item/);
 assert.match(itemPage,/Inappropriate content/);
 assert.match(itemPage,/Image doesn’t match this product/);
 assert.match(itemPage,/Incorrect product information/);
 assert.match(itemPage,/action=\{reportProductItem\}/);
 assert.match(itemActions,/report_product_item/);
 assert.match(exceptionReviewMigration,/member_report/);
 assert.match(exceptionReviewMigration,/priority_score/);
 assert.match(exceptionReviewMigration,/v_status='provisional'.*v_score:=3/s);
 assert.match(exceptionReviewMigration,/v_status='verified'.*else 1/s);
 assert.match(exceptionReviewMigration,/prefix_name_similarity/);
});

test("reviewed alias, flag, and Product Photo controls stay behind the audited admin boundary",()=>{
 assert.match(adminControlsMigration,/admin_dismiss_catalog_review_flag/);
 assert.match(adminControlsMigration,/admin_add_product_alias/);
 assert.match(adminControlsMigration,/admin_add_brand_alias/);
 assert.match(adminControlsMigration,/admin_clear_pending_product_photo/);
 assert.match(adminControlsMigration,/admin_remove_product_photo_evidence/);
 assert.match(adminControlsMigration,/private\.is_admin\(\)/);
 assert.match(aliasHardeningMigration,/drop policy if exists "authenticated add brand alias"/);
 assert.match(aliasHardeningMigration,/revoke insert on public\.brand_aliases from authenticated/);
 assert.match(actions,/dismissCatalogFlag/);
 assert.match(actions,/addProductAlias/);
 assert.match(actions,/addBrandAlias/);
 assert.match(actions,/removePendingProductPhoto/);
 assert.match(actions,/removeCanonicalProductPhoto/);
 assert.match(actions,/storage\.from\("catalog-submission-photos"\)\.remove/);
 assert.match(actions,/storage\.from\("product-photos"\)\.remove/);
 assert.match(page,/Possible duplicates \/ identity review/);
 assert.match(page,/Reviewed aliases/);
 assert.match(page,/Product Photo moderation/);
 assert.match(page,/Dismiss flag/);
 assert.match(page,/Add Brand alias/);
 assert.match(page,/Add Product alias/);
 assert.match(page,/Remove Product Photo/);
});
