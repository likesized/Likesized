import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const itemPage=fs.readFileSync("app/item/[slug]/page.tsx","utf8");
const fituitionSections=fs.readFileSync("app/item/[slug]/FituitionSections.tsx","utf8");
const scaleMigration=fs.readFileSync("supabase/migrations/20260828120000_versioned_match_and_fituition_cache.sql","utf8");
const historicalMigration=fs.readFileSync("supabase/migrations/20260828123000_historical_snapshot_candidate_scaling.sql","utf8");
const latestEvidenceMigration=fs.readFileSync("supabase/migrations/20260828124000_preserve_latest_historical_evidence_units.sql","utf8");

test("garment shell streams before the one deferred personalized FITuition block",()=>{
  assert.doesNotMatch(itemPage,/FituitionRecommendationFallback/);
  assert.match(itemPage,/Suspense fallback={<FituitionEvidenceFallback\/>}/);
  assert.match(itemPage,/<ItemActionsClient/);
  assert.ok(itemPage.indexOf("<ItemActionsClient")<itemPage.indexOf("<FituitionEvidenceSections"));
  assert.doesNotMatch(itemPage,/get_product_evidence_candidates/);
  assert.match(fituitionSections,/const loadFituitionData=cache\(async/);
  assert.match(fituitionSections,/get_product_evidence_candidates/);
  assert.match(fituitionSections,/Calculating your fit evidence…/);
  assert.match(fituitionSections,/Retry FITuition →/);
});

test("historical garment evidence shortlists immutable body snapshots rather than current-person neighborhoods",()=>{
  assert.match(historicalMigration,/fit_profile_version_candidate_buckets/);
  assert.match(historicalMigration,/discover_historical_product_snapshot_candidates/);
  assert.match(latestEvidenceMigration,/discover_historical_product_snapshot_candidates\(p_product_id,1400\)/);
  assert.doesNotMatch(latestEvidenceMigration,/discover_fit_match_candidates\(/);
});

test("historical shortlist never makes an old report outrank the latest canonical evidence unit",()=>{
  assert.match(latestEvidenceMigration,/candidate_users as materialized/);
  assert.match(latestEvidenceMigration,/join public\.fit_reports fr on fr\.user_id=cu\.user_id/);
  assert.match(latestEvidenceMigration,/partition by r\.user_id,r\.evidence_product_id,coalesce\(r\.objective_variant_key,''\)/);
  assert.match(latestEvidenceMigration,/order by r\.observed_at desc,r\.fit_report_id desc/);
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
