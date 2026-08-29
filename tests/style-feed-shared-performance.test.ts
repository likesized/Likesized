import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const personCard=fs.readFileSync("components/CanonicalPersonQuickViewCard.tsx","utf8");
const peopleActions=fs.readFileSync("app/people/actions.ts","utf8");
const people=fs.readFileSync("app/people/page.tsx","utf8");
const circle=fs.readFileSync("app/circle/page.tsx","utf8");
const gallery=fs.readFileSync("app/outfits/[id]/OutfitGallery.tsx","utf8");
const taggedPanel=fs.readFileSync("app/outfits/[id]/TaggedItemsPanel.tsx","utf8");
const summaryRoute=fs.readFileSync("app/api/outfits/[id]/tagged-fit-summary/route.ts","utf8");
const scalingMigration=fs.readFileSync("supabase/migrations/20260828100000_scalable_fit_evidence_reads.sql","utf8");

test("universal person quick view toggles Follow in place without a navigation form",()=>{
  assert.match(personCard,/function toggleFollow\(\)/);
  assert.match(personCard,/formData\.set\("stay_open","1"\)/);
  assert.match(personCard,/await\(next\?followPerson:unfollowPerson\)\(formData\)/);
  assert.match(personCard,/action="follow" active=\{followActive\} type="button"/);
  assert.doesNotMatch(personCard,/<form action=\{unfollowPerson\}>/);
  assert.doesNotMatch(personCard,/<form action=\{followPerson\}>/);
});

test("stay-open Follow persistence preserves the void action contract and bypasses revalidation",()=>{
  assert.match(peopleActions,/const stayOpen = String\(formData\.get\("stay_open"\)/);
  const followStay=peopleActions.indexOf("if (stayOpen) return;");
  const firstFollowRevalidate=peopleActions.indexOf('revalidatePath("/following")');
  assert.ok(followStay>=0&&firstFollowRevalidate>followStay);
  const unfollowStart=peopleActions.indexOf("export async function unfollowPerson");
  const unfollowStay=peopleActions.indexOf("if (stayOpen) return;",unfollowStart);
  const unfollowRevalidate=peopleActions.indexOf('revalidatePath("/following")',unfollowStart);
  assert.ok(unfollowStay>unfollowStart&&unfollowRevalidate>unfollowStay);
  assert.doesNotMatch(peopleActions,/return \{ ok: true \}/);
});

test("shared gallery uses natural media height without reintroducing per-photo height bookkeeping",()=>{
  assert.match(gallery,/src=\{current\.url\}/);
  assert.doesNotMatch(gallery,/stableStageHeight|62dvh|height:stableStageHeight/);
  assert.doesNotMatch(gallery,/stageHeights=useRef/);
  assert.doesNotMatch(gallery,/syncStageHeight/);
  assert.doesNotMatch(gallery,/transition:"min-height/);
  assert.match(gallery,/overflow:"auto"/);
});

test("tagged garment cards use one cached Outfit summary and full FITuition only for the selected garment",()=>{
  assert.match(taggedPanel,/\/tagged-fit-summary/);
  assert.match(taggedPanel,/fitSummaryInFlight/);
  assert.match(taggedPanel,/FIT_SUMMARY_TTL_MS/);
  assert.match(taggedPanel,/void loadFitMeta\(selectedId,controller\.signal\)/);
  assert.doesNotMatch(taggedPanel,/items\.forEach\(\(item,index\)=>\{void loadFitMeta/);
  assert.match(summaryRoute,/get_outfit_tagged_fit_counts/);
  assert.match(summaryRoute,/STRONG_FIT_REPORT_MATCH_THRESHOLD/);
});

test("People and Style Feed share one set-wise match scan instead of recalculating categories independently",()=>{
  assert.match(people,/get_fit_matches_batch/);
  assert.match(people,/\["overall", "tops", "bottoms"\]/);
  assert.doesNotMatch(people,/rpc\("get_fit_matches"/);
  assert.doesNotMatch(people,/createSignedUrl/);
  assert.match(circle,/get_fit_matches_batch/);
  assert.match(circle,/\["tops","bottoms"\]/);
  assert.doesNotMatch(circle,/rpc\("get_fit_matches"/);
  assert.match(scalingMigration,/create or replace function public\.get_fit_matches_batch/);
  assert.match(scalingMigration,/cross join weights w/);
});

test("Outfit tagged-fit summary counts exact evidence directly instead of invoking the full FITuition hierarchy",()=>{
  assert.match(scalingMigration,/create or replace function public\.get_outfit_tagged_fit_counts/);
  assert.match(scalingMigration,/community_candidates/);
  assert.match(scalingMigration,/calculate_snapshot_matches_for_product\(/);
  assert.doesNotMatch(scalingMigration,/calculate_snapshot_match_for_product\(/);
  const taggedStart=scalingMigration.indexOf("create or replace function public.get_outfit_tagged_fit_counts");
  assert.ok(taggedStart>=0);
  const taggedBody=scalingMigration.slice(taggedStart);
  assert.doesNotMatch(taggedBody,/get_product_evidence_candidates\(/);
  assert.match(scalingMigration,/revoke all on function public\.get_outfit_tagged_fit_counts\(uuid,integer\) from public,anon/);
  assert.match(scalingMigration,/grant execute on function public\.get_outfit_tagged_fit_counts\(uuid,integer\) to authenticated/);
});
