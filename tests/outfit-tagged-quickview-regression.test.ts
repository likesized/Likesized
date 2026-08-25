import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const taggedFit=readFileSync(new URL("../app/api/outfits/[id]/tagged-fit/route.ts",import.meta.url),"utf8");
const taggedPanel=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");

test("photo hotspots can open the canonical tagged quick view from any detail tab",()=>{
  assert.match(tabs,/tab==="style"\?<div ref=\{styleRef\}/);
  assert.match(tabs,/tab==="comments"\?comments:null/);
  assert.match(tabs,/taggedTabDormant/);
  assert.match(tabs,/\{taggedItems\}/);
  assert.match(tabs,/return_to:`\$\{window\.location\.pathname\}\$\{window\.location\.search\}`/);
  assert.match(css,/\.taggedTabDormant \.taggedGrid\{display:none\}/);
});

test("Matching Fit Reports and recommendation evidence collapse repeat reports by tracked variation",()=>{
  assert.match(taggedFit,/newestUniqueVariationEvidence/);
  assert.match(taggedFit,/objective_variant_key/);
  assert.match(taggedFit,/const relevantExact=candidates\.filter/);
  assert.match(taggedFit,/row\.historical_match_score>=QUICK_VIEW_STRONG_MATCH_THRESHOLD/);
  assert.match(taggedFit,/matchingFitReports:relevantExact\.length/);
});

test("insufficient FITuition copy agrees with a positive matching-evidence count",()=>{
  assert.match(taggedPanel,/I’m not confident enough to recommend a size yet\./);
  assert.match(taggedPanel,/I found \{meta\.matchingFitReports\} Fit Report/);
  assert.match(taggedPanel,/for this exact variation from people close to your measurements/);
  assert.doesNotMatch(taggedPanel,/No useful exact-item Fit Reports match your Fit Profile yet/);
});

test("mobile tagged quick view stays readable and Report stays in the viewport",()=>{
  assert.match(css,/\.itemPreviewInfo\{display:grid;gap:3px;min-width:0\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewCard\{width:100%;max-height:min\(86dvh,720px\);padding:18px;border-radius:18px\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemReport>form\{position:fixed/);
});
