import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const taggedFit=readFileSync(new URL("../app/api/outfits/[id]/tagged-fit/route.ts",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");

test("photo hotspots can open the canonical tagged quick view from any detail tab",()=>{
  assert.match(tabs,/tab==="style"\?styleNotes:null/);
  assert.match(tabs,/tab==="comments"\?comments:null/);
  assert.match(tabs,/taggedTabDormant/);
  assert.match(tabs,/\{taggedItems\}/);
  assert.match(css,/\.taggedTabDormant \.taggedGrid\{display:none\}/);
});

test("viewer-owned exact Product Fit Reports cannot disappear from Matching Fit Reports",()=>{
  assert.match(taggedFit,/ownExactReports=ownReports\.filter/);
  assert.match(taggedFit,/report\.product_id===product\.id&&report\.garment_condition==="normal"/);
  assert.match(taggedFit,/usefulExactIds=new Set/);
  assert.match(taggedFit,/usefulExactIds\.add\(report\.id\)/);
  assert.match(taggedFit,/matchingFitReports:usefulExactIds\.size/);
});

test("mobile tagged quick view stays readable and Report stays in the viewport",()=>{
  assert.match(css,/\.itemPreviewInfo>strong,\.itemPreviewInfo>span,\.fitSnippet strong,\.fitSnippet span\{white-space:normal;overflow-wrap:anywhere\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewCard\{width:min\(380px,calc\(100vw - 16px\)\);max-height:calc\(100dvh - 16px\);overflow:auto/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemReport>form\{position:fixed;z-index:150;left:12px;right:12px;top:auto;bottom:max\(12px,env\(safe-area-inset-bottom\)\)/);
});
