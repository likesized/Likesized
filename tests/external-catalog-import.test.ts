import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260822005100_add_channel3_catalog_provenance.sql", "utf8");
const productSpec = readFileSync("docs/V1_PRODUCT_SPEC.md", "utf8");
const adapter = readFileSync("lib/catalog-import.ts", "utf8");
const intake = readFileSync("app/closet/add/CatalogGarmentFields.tsx", "utf8");
const lookupRoute = readFileSync("app/api/catalog/lookup/route.ts", "utf8");

test("external catalog imports have hard owner-controlled caps and no automatic billing", () => {
  assert.match(migration, /channel3_catalog/);
  assert.match(migration, /monthly_request_limit=1000/);
  assert.match(migration, /warning_percent=80/);
  assert.match(migration, /critical_percent=95/);
  assert.match(migration, /no_paid_overage=true/);
  assert.match(productSpec, /no automatic paid overage, upgrade, or billing action/i);
});

test("external source data remains part of the one catalog and manual entry is last", () => {
  assert.match(productSpec, /Manual item creation is the final fallback/i);
  assert.match(productSpec, /one canonical Product\/provenance system/i);
  assert.match(productSpec, /80%/);
  assert.match(productSpec, /95%/);
  assert.match(adapter, /CHANNEL3_API_KEY/);
  assert.match(adapter, /api\.trychannel3\.com\/v1\/search/);
  assert.match(adapter, /cleaned_url/);
  assert.match(migration, /source_payload jsonb not null/);
  assert.doesNotMatch(adapter, /SERPAPI_API_KEY/);
  assert.doesNotMatch(adapter, /api\.search\.brave\.com/);
});

test("selected Channel3 products are hydrated through URL lookup before intake", () => {
  assert.match(adapter, /api\.trychannel3\.com\/v1\/lookup/);
  assert.match(adapter, /JSON\.stringify\(\{ url: sourceUrl \}\)/);
  assert.match(lookupRoute, /reserve_catalog_import_request/);
  assert.match(lookupRoute, /lookupChannel3CatalogCandidate/);
  assert.match(lookupRoute, /retrieveChannel3CatalogCandidate/);
  assert.match(adapter, /v1\/products/);
  assert.match(intake, /fetch\("\/api\/catalog\/lookup"/);
});

test("retail imports use structured category and variant data instead of raw text guessing", () => {
  assert.match(adapter, /product\.category/);
  assert.match(adapter, /product\.variants/);
  assert.match(adapter, /structured_attributes/);
  assert.match(adapter, /trusted_colors/);
  assert.match(adapter, /raw_payload_json/);
  assert.doesNotMatch(intake, /sourceWords/);
  assert.doesNotMatch(intake, /inferredGarmentType/);
  assert.doesNotMatch(intake, /inferredAnswers/);
  assert.doesNotMatch(intake, /Imported details:/);
});

test("ambiguous retailer type requires member confirmation instead of blocking or guessing", () => {
  assert.match(intake, /We found the product but need this one detail before continuing\./);
  assert.match(intake, /provider&&!type/);
  assert.doesNotMatch(intake, /This retailer did not identify a specific garment type, so this item cannot be imported yet/);
});
