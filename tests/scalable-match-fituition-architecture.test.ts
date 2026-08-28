import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const itemPage=fs.readFileSync("app/item/[slug]/page.tsx","utf8");
const fituitionSections=fs.readFileSync("app/item/[slug]/FituitionSections.tsx","utf8");
const scaleMigration=fs.readFileSync("supabase/migrations/20260828120000_versioned_match_and_fituition_cache.sql","utf8");
const historicalMigration=fs.readFileSync("supabase/migrations/20260828123000_historical_snapshot_candidate_scaling.sql","utf8");

test("garment shell streams before uncached full personalized FITuition",()=>{
  assert.match(itemPage,/Suspense fallback={<FituitionRecommendationFallback\/>}/);
  assert.match(itemPage,/Suspense fallback={<FituitionEvidenceFallback\/>}/);
  assert.match(itemPage,/ItemActionsClient/);
  assert.doesNotMatch(itemPage,/get_product_evidence_candidates/);
  assert.match(fituitionSections,/const loadFituitionData=cache\(async/);
  assert.match(fituitionSections,/get_product_evidence_candidates/);
  assert.match(fituitionSections,/Calculating your FITuition…/);
  assert.match(fituitionSections,/Retry FITuition →/);
});

test("historical garment evidence shortlists immutable body snapshots rather than current-person neighborhoods",()=>{
  assert.match(historicalMigration,/fit_profile_version_candidate_buckets/);
  assert.match(historicalMigration,/discover_historical_product_snapshot_candidates/);
  const coreStart=historicalMigration.indexOf("create or replace function private.resolve_product_evidence_core");
  assert.ok(coreStart>=0);
  const core=historicalMigration.slice(coreStart);
  assert.match(core,/discover_historical_product_snapshot_candidates\(p_product_id,1400\)/);
  assert.doesNotMatch(core,/discover_fit_match_candidates\(/);
});

test("versioned Match caches remain demand-driven and invalidate displayed targets by input revision",()=>{
  assert.match(scaleMigration,/private\.current_person_match_cache/);
  assert.match(scaleMigration,/private\.fit_match_neighborhood_cache/);
  assert.match(scaleMigration,/target_fp\.match_input_version<>\(item->>'target_input_version'\)::bigint/);
  assert.match(historicalMigration,/fit_profiles_bump_match_input_on_fit_community_change/);
  assert.match(historicalMigration,/new\.match_input_version:=old\.match_input_version\+1/);
});

test("candidate discovery and personalized caches stay explicitly bounded",()=>{
  assert.match(scaleMigration,/least\(greatest\(coalesce\(p_candidate_limit,700\),50\),900\)/);
  assert.match(scaleMigration,/limit 110/);
  assert.match(historicalMigration,/least\(greatest\(coalesce\(p_candidate_limit,1400\),200\),1800\)/);
  assert.match(historicalMigration,/limit 450/);
  assert.match(historicalMigration,/limit 650/);
  assert.match(scaleMigration,/computed_at>=now\(\)-interval '12 hours'/);
});
