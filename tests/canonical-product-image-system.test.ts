import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260828001000_canonical_product_image_scoring.sql", "utf8");
const resolver = readFileSync("lib/canonical-product-images.ts", "utf8");
const admin = readFileSync("app/moderation/CanonicalProductImageAdmin.tsx", "utf8");

test("13A keeps tracked variation separate from counted-report objective identity", () => {
  assert.match(migration, /add column tracked_variation_key text/);
  assert.match(migration, /current_tracked_variation_key/);
  assert.match(migration, /e\.key not in \('intended_fit','shoe_use'\)/);
  const selectionRegion = migration.slice(migration.indexOf("create or replace function private.fit_photo_variation_key"));
  assert.ok(!selectionRegion.includes("fr.objective_variant_key"), "canonical Product imagery must not reuse counted-report objective_variant_key");
});

test("13A automatic eligibility excludes flagged and extremely low-resolution scored Fit Photos", () => {
  assert.match(migration, /fp\.quality_source='legacy_neutral' or fp\.resolution_score>=50/);
  assert.match(migration, /cr\.target_type='fit_reference_photo'/);
  assert.match(migration, /cr\.status='open'/);
  assert.match(migration, /refresh_canonical_product_image_after_content_report/);
});

test("canonical Product image reads stay bounded and batch private URL signing", () => {
  assert.match(resolver, /get_canonical_product_images/);
  assert.match(resolver, /MAX_CANONICAL_IMAGE_BATCH = 200/);
  assert.match(resolver, /requests\.length > MAX_CANONICAL_IMAGE_BATCH/);
  assert.match(resolver, /createSignedUrls/);
  assert.ok(!resolver.includes("createSignedUrl("), "canonical image resolver must not sign Fit Photos one at a time");
});

test("admin Product-image controls expose set, lock, unlock and eligibility review", () => {
  assert.match(admin, /Set as Product Image/);
  assert.match(admin, /Lock Product Image/);
  assert.match(admin, /Unlock Product Image/);
  assert.match(admin, /Mark Ineligible/);
  assert.match(admin, /Set for Exact Variation/);
  assert.match(admin, /createSignedUrls/);
  assert.ok(!admin.includes("createSignedUrl("), "13A admin candidate signing must stay batched");
});
