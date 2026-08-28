import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260828001000_canonical_product_image_scoring.sql", "utf8");
const duplicateMigration = readFileSync("supabase/migrations/20260828001200_fit_photo_perceptual_duplicates.sql", "utf8");
const resolver = readFileSync("lib/canonical-product-images.ts", "utf8");
const quality = readFileSync("lib/fit-photo-quality-server.ts", "utf8");
const closetActions = readFileSync("app/closet/actions.ts", "utf8");
const photoFields = readFileSync("app/closet/add/FitReportPhotoFields.tsx", "utf8");
const admin = readFileSync("app/moderation/CanonicalProductImageAdmin.tsx", "utf8");
const adminLayout = readFileSync("app/moderation/layout.tsx", "utf8");
const adminRoute = readFileSync("app/moderation/product-images/page.tsx", "utf8");

test("13A keeps tracked variation separate from counted-report objective identity", () => {
  assert.match(migration, /add column tracked_variation_key text/);
  assert.match(migration, /current_tracked_variation_key/);
  assert.match(migration, /e\.key not in \('intended_fit','shoe_use'\)/);
  const selectionRegion = migration.slice(migration.indexOf("create or replace function private.fit_photo_variation_key"));
  assert.ok(!selectionRegion.includes("fr.objective_variant_key"), "canonical Product imagery must not reuse counted-report objective_variant_key");
});

test("13A uses the owner-locked deterministic image score weights", () => {
  assert.match(migration, /garment_visibility_score \* 35/);
  assert.match(migration, /sharpness_score \* 20/);
  assert.match(migration, /resolution_score \* 15/);
  assert.match(migration, /framing_score \* 20/);
  assert.match(migration, /exposure_score \* 10/);
});

test("13A automatic eligibility excludes flagged and extremely low-resolution scored Fit Photos", () => {
  assert.match(migration, /fp\.quality_source='legacy_neutral' or fp\.resolution_score>=50/);
  assert.match(migration, /cr\.target_type='fit_reference_photo'/);
  assert.match(migration, /cr\.status='open'/);
  assert.match(migration, /refresh_canonical_product_image_after_content_report/);
});

test("Fit Photo quality and perceptual fingerprints are computed from the submitted file on the server path", () => {
  assert.match(quality, /import sharp from "sharp"/);
  assert.match(quality, /HASH_WIDTH = 9/);
  assert.match(quality, /HASH_HEIGHT = 8/);
  assert.match(quality, /perceptual_hash: await perceptualHash\(input\)/);
  assert.match(closetActions, /analyzeFitPhotoQuality\(photo\)/);
  assert.match(closetActions, /record_fit_photo_perceptual_fingerprint/);
  assert.ok(!closetActions.includes("parseFitPhotoQuality"), "server action must not trust client-supplied image quality scores");
  assert.ok(!photoFields.includes("photo_front_quality"), "Fit Photo controls must not submit authoritative hidden quality payloads");
  assert.ok(!photoFields.includes("photo_back_quality"), "Fit Photo controls must not submit authoritative hidden quality payloads");
});

test("13A records private perceptual fingerprints and removes near-duplicates from competition", () => {
  assert.match(duplicateMigration, /create table private\.fit_photo_perceptual_fingerprints/);
  assert.match(duplicateMigration, /fingerprint bit\(64\)/);
  assert.match(duplicateMigration, /bit_count\(f\.fingerprint # v_fingerprint\)<=v_threshold/);
  assert.match(duplicateMigration, /perceptual_duplicate_hamming_distance smallint not null default 5/);
  assert.match(duplicateMigration, /set duplicate_of=/);
  assert.ok(!duplicateMigration.includes("public.fit_photo_perceptual_fingerprints"), "perceptual fingerprints must never become member-readable Product metadata");
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

test("Product-image review is an explicit lazy admin destination rather than eager moderation work", () => {
  assert.match(adminLayout, /href="\/moderation\/product-images"/);
  assert.ok(!adminLayout.includes("CanonicalProductImageAdmin"));
  assert.match(adminRoute, /<CanonicalProductImageAdmin \/>/);
  assert.match(adminRoute, /is_current_user_admin/);
});
