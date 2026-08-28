import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const explore=fs.readFileSync("app/explore/page.tsx","utf8");
const people=fs.readFileSync("app/people/page.tsx","utf8");
const circle=fs.readFileSync("app/circle/page.tsx","utf8");
const migration=fs.readFileSync("supabase/migrations/20260828100000_scalable_fit_evidence_reads.sql","utf8");

test("representative-data repair changes read shape without weakening matching thresholds",()=>{
  assert.match(explore,/\(scores\.get\(product\.id\)\?\?0\)>=75/);
  assert.match(people,/fitTwinDesignation/);
  assert.match(circle,/fitTwinDesignation/);
  assert.match(migration,/private\.confidence_adjusted_match/);
  assert.match(migration,/private\.refine_snapshot_product_match_with_proportions/);
  assert.match(migration,/private\.directional_fit_support_from_pressure/);
});
