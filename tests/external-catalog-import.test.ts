import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260822005100_add_channel3_catalog_provenance.sql", "utf8");
const productSpec = readFileSync("docs/V1_PRODUCT_SPEC.md", "utf8");
const adapter = readFileSync("lib/catalog-import.ts", "utf8");

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
