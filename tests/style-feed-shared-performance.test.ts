import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const personCard=fs.readFileSync("components/CanonicalPersonQuickViewCard.tsx","utf8");
const peopleActions=fs.readFileSync("app/people/actions.ts","utf8");
const gallery=fs.readFileSync("app/outfits/[id]/OutfitGallery.tsx","utf8");
const taggedPanel=fs.readFileSync("app/outfits/[id]/TaggedItemsPanel.tsx","utf8");
const summaryRoute=fs.readFileSync("app/api/outfits/[id]/tagged-fit-summary/route.ts","utf8");
const batchMigration=fs.readFileSync("supabase/migrations/20260827214500_batch_outfit_tagged_fit_counts.sql","utf8");

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

test("shared gallery keeps one stable viewport across mixed-aspect swipes and mobile browser chrome changes",()=>{
  assert.match(gallery,/const stableStageHeight="clamp\(260px,62svh,620px\)"/);
  assert.match(gallery,/style=\{\{height:stableStageHeight,[\s\S]*overflow:"hidden"\}\}/);
  assert.match(gallery,/className=\{styles\.galleryMedia\} style=\{\{position:"relative",width:"100%",height:"100%"\}\}/);
  assert.match(gallery,/src=\{current\.url\}[\s\S]*style=\{\{maxHeight:"100%"\}\}/);
  assert.doesNotMatch(gallery,/const stableStageHeight=.*dvh/);
  assert.doesNotMatch(gallery,/stageHeights=useRef/);
  assert.doesNotMatch(gallery,/syncStageHeight/);
  assert.doesNotMatch(gallery,/transition:"min-height/);
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

test("Outfit tagged-fit summary is a bounded authenticated batch database boundary",()=>{
  assert.match(batchMigration,/create or replace function public\.get_outfit_tagged_fit_counts/);
  assert.match(batchMigration,/limit 200/);
  assert.match(batchMigration,/get_product_evidence_candidates\([\s\S]*300/);
  assert.match(batchMigration,/revoke all on function public\.get_outfit_tagged_fit_counts\(uuid, integer\) from public, anon/);
  assert.match(batchMigration,/grant execute on function public\.get_outfit_tagged_fit_counts\(uuid, integer\) to authenticated/);
});