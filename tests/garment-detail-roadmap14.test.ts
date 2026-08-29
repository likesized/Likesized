import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page=readFileSync("app/item/[slug]/page.tsx","utf8");
const fituition=readFileSync("app/item/[slug]/FituitionSections.tsx","utf8");
const actions=readFileSync("app/item/[slug]/ItemActionsClient.tsx","utf8");
const variation=readFileSync("lib/tracked-variation.ts","utf8");
const likeActions=readFileSync("app/likelocker/actions.ts","utf8");
const recommendation=readFileSync("lib/recommendation.ts","utf8");
const notify=readFileSync("app/item/[slug]/GarmentNotifyButton.tsx","utf8");
const inspiration=readFileSync("app/item/[slug]/StyleInspiration.tsx","utf8");

test("Garment Detail exposes independent shopper-facing attribute filter rows",()=>{
  assert.match(page,/trackedVariationParts/);
  assert.match(page,/opt_/);
  assert.match(page,/optionGroups/);
  assert.match(page,/optionGroup/);
  assert.match(page,/matchesSelection/);
  assert.match(page,/filterHref/);
  assert.ok(!page.includes("trackedVariationShortLabel"));
  assert.ok(!page.includes("trackedVariationDetail"));
  assert.ok(!page.includes("product_variants"));
  assert.ok(!page.includes("color_label"));
  assert.match(variation,/classification === "variation-defining"/);
});

test("Garment Detail keeps one owner-approved FITuition hierarchy",()=>{
  assert.match(fituition,/FITuition recommends: Size/);
  assert.match(fituition,/Confidence:/);
  assert.match(fituition,/Aggregate Fit Report evidence/);
  assert.match(fituition,/YOUR CLOSEST MATCH/);
  assert.match(fituition,/Not enough evidence yet to confidently recommend a size\./);
  assert.match(fituition,/BEST AVAILABLE MATCH/);
  assert.match(fituition,/Lower Body Matches may be less predictive/);
  assert.match(fituition,/GarmentNotifyButton/);
  assert.doesNotMatch(fituition,/SIZE MATCH EVIDENCE|YOUR CLOSET HISTORY|BEST EXACT VARIATION|CLOSEST RELATED VARIATION/);
  assert.doesNotMatch(page,/FituitionRecommendation/);
});

test("individual FITuition evidence links Body Match users to canonical profiles",()=>{
  assert.match(fituition,/MatchPercentageBadge/);
  assert.match(fituition,/href=\{`\/people\/\$\{encodeURIComponent\(username\)\}`\}/);
  assert.match(fituition,/Fit Result:/);
  assert.match(fituition,/STRONG_FIT_REPORT_MATCH_THRESHOLD/);
});

test("Garment Detail reuses canonical recommendation math and bounded candidate discovery",()=>{
  assert.match(fituition,/recommendSize\(\[\.\.\.communityEvidence,\.\.\.closetEvidence\]\)/);
  assert.match(fituition,/closetEvidenceRelevance/);
  assert.match(fituition,/p_result_limit:300/);
  assert.match(fituition,/limit\(200\)/);
  assert.match(recommendation,/export function recommendSize/);
  assert.ok(!fituition.includes("function recommendSize"));
});

test("Garment Detail uses shared canonical Product imagery and deferred evidence",()=>{
  assert.match(page,/resolveCanonicalProductImages/);
  assert.match(page,/canonicalProductImageKey/);
  assert.match(page,/variationKey:selectedVariationKey/);
  assert.match(page,/<Suspense fallback=\{<FituitionEvidenceFallback\/>\}>/);
  assert.match(page,/<FituitionEvidenceSections/);
  assert.ok(!page.includes("product.image_url||"));
});

test("Garment Detail utility actions remain canonical",()=>{
  assert.match(actions,/action="likeLocker"/);
  assert.match(actions,/action="wishLocker"/);
  assert.match(actions,/action="shop"/);
  assert.match(actions,/action="share"/);
  assert.match(actions,/action="report"/);
  assert.ok(!actions.includes("count="));
  assert.ok(likeActions.includes("/item\\/"));
});

test("insufficient evidence uses canonical Notify and Style Inspiration stays bounded",()=>{
  assert.match(notify,/evidence-watch/);
  assert.match(inspiration,/MAX_REPORTS=120/);
  assert.match(inspiration,/MAX_POSTS=24/);
  assert.match(inspiration,/DISPLAY_COUNT=3/);
  assert.match(inspiration,/LOOKBACK_DAYS=90/);
  assert.match(inspiration,/hasMore\?<Link/);
  assert.match(page,/StyleInspirationFallback/);
});
