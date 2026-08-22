import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration=readFileSync("supabase/migrations/20260822000129_add_content_moderation.sql","utf8");
const page=readFileSync("app/moderation/page.tsx","utf8");
const actions=readFileSync("app/moderation/actions.ts","utf8");
const report=readFileSync("components/ReportContentForm.tsx","utf8");

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

test("member garment confirmations flag conflicts and owner decisions lock verified values",()=>{
 assert.match(migration,/admin_lock_product_field/);
 assert.match(migration,/catalog_moderation_actions/);
 assert.match(migration,/source_status='verified'/);
 assert.match(migration,/product_description_evidence/);
 assert.match(page,/Disputed garment information/);
 assert.match(page,/Lock decision/);
});
