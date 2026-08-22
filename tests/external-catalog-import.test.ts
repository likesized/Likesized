import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260822005000_add_external_catalog_import_controls.sql", "utf8");
const productSpec = readFileSync("docs/V1_PRODUCT_SPEC.md", "utf8");
const adapter = readFileSync("lib/catalog-import.ts", "utf8");

test("external catalog imports have hard owner-controlled caps and no automatic billing", () => {
  assert.match(migration, /create table private\.catalog_import_providers/);
  assert.match(migration, /enabled boolean not null default false/);
  assert.match(migration, /no_paid_overage boolean not null default true/);
  assert.match(migration, /limit_reached/);
  assert.match(migration, /rate_limited/);
  assert.match(productSpec, /no automatic paid overage, upgrade, or billing action/i);
});

test("external source data remains part of the one catalog and manual entry is last", () => {
  assert.match(productSpec, /Manual item creation is the final fallback/i);
  assert.match(productSpec, /one canonical Product\/provenance system/i);
  assert.match(productSpec, /80%/);
  assert.match(productSpec, /95%/);
  assert.match(adapter, /BRAVE_SEARCH_API_KEY/);
  assert.match(adapter, /X-Subscription-Token/);
  assert.doesNotMatch(adapter, /SERPAPI_API_KEY/);
});
