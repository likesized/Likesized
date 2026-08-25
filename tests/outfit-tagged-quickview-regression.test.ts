import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const taggedFit=readFileSync(new URL("../app/api/outfits/[id]/tagged-fit/route.ts",import.meta.url),"utf8");
const taggedPanel=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");

test("photo hotspots can open the canonical tagged quick view from any detail tab",()=>{
  assert.match(tabs,/tab==="style"\?styleNotes:null/);
  assert.match(tabs,/tab==="comments"\?comments:null/);
  assert.match(tabs,/taggedTabDormant/);
  assert.match(tabs,/\{taggedItems\}/);
  assert.match(css,/\.taggedTabDormant \.taggedGrid\{display:none\}/);
});

test("Matching Fit Reports and recommendation evidence collapse repeat reports by tracked variation",()=>{
  assert.match(taggedFit,/newestUniqueVariationEvidence/);
  assert.match(taggedFit,/objective_variant_key/);
  assert.match(taggedFit,/usefulExactVariations=new Set/);
  assert.match(taggedFit,/variationEvidenceKey\(report\.user_id,report\.product_id,report\.objective_variant_key,report\.id\)/);
  assert.match(taggedFit,/matchingFitReports:usefulExactVariations\.size/);
});

test("insufficient FITuition copy agrees with a positive matching-evidence count",()=>{
  assert.match(taggedPanel,/FITuition isn’t confident enough yet\./);
  assert.match(taggedPanel,/We found \{meta\.matchingFitReports\} relevant fit/);
  assert.doesNotMatch(taggedPanel,/No useful exact-item Fit Reports match your Fit Profile yet/);
});

test("mobile tagged quick view stays readable and Report stays in the viewport",()=>{
  assert.match(css,/\.itemPreviewInfo>strong,\.itemPreviewInfo>span,\.fitSnippet strong,\.fitSnippet span\{white-space:normal;overflow-wrap:anywhere\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewCard\{width:min\(380px,calc\(100vw - 16px\)\);max-height:calc\(100dvh - 16px\);overflow:auto/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemReport>form\{position:fixed;z-index:150;left:12px;right:12px;top:auto;bottom:max\(12px,env\(safe-area-inset-bottom\)\)/);
});
