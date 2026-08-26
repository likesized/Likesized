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
  assert.doesNotMatch(tabs,/return_to/);
  assert.match(tabs,/window\.location\.assign\(`\/explore\?\$\{params\.toString\(\)\}`\)/);
  assert.match(css,/\.taggedTabDormant \.taggedGrid\{display:none\}/);
});

test("Relevant Fit Report evidence and recommendation evidence collapse repeat reports by tracked variation",()=>{
  assert.match(taggedFit,/newestUniqueVariationEvidence/);
  assert.match(taggedFit,/objective_variant_key/);
  assert.match(taggedFit,/const relevantExact=candidates\.filter/);
  assert.match(taggedFit,/row\.historical_match_score>=STRONG_FIT_REPORT_MATCH_THRESHOLD/);
  assert.match(taggedFit,/matchingFitReports:relevantExact\.length/);
  assert.match(taggedFit,/strongFitReports:strongAggregate\(relevantExact/);
  assert.match(taggedFit,/source:"community"/);
  assert.match(taggedFit,/source:"closet"/);
  assert.match(taggedFit,/recommendSize\(\[\.\.\.otherEvidence,\.\.\.ownHistory\]\)/);
});

test("insufficient FITuition copy agrees with a positive Relevant Fit Report count",()=>{
  assert.match(taggedPanel,/I’m not confident enough to recommend a size yet\./);
  assert.match(taggedPanel,/I found \{meta\.matchingFitReports\} relevant Fit Report/);
  assert.match(taggedPanel,/combined Size Match and Closet evidence does not point clearly to one size/);
  assert.doesNotMatch(taggedPanel,/No useful exact-item Fit Reports match your Fit Profile yet/);
});

test("tagged FITuition resolves failed requests instead of hanging forever",()=>{
  assert.match(taggedPanel,/new AbortController\(\)/);
  assert.match(taggedPanel,/fitErrors/);
  assert.match(taggedPanel,/FITuition couldn’t load this evidence/);
  assert.match(taggedPanel,/>Try again<\/button>/);
  assert.match(taggedPanel,/\},\[selectedId,signedIn,postId,retryToken\]\)/);
  assert.doesNotMatch(taggedPanel,/\[selectedId,signedIn,postId,fitMeta,fitLoading\]/);
});

test("hybrid FITuition can recommend from useful Closet evidence while Relevant Fit Reports are still growing",()=>{
  assert.match(taggedFit,/const canRecommend=Boolean\(recommendation&&recommendation\.confidence>=45\)/);
  assert.doesNotMatch(taggedFit,/recommendation\.confidence>=45&&relevantExact\.length>0/);
  assert.match(taggedPanel,/Your relevant Closet History provides the strongest current signal/);
  assert.match(taggedPanel,/Notify me when Fit Reports from people close to my measurements are posted/);
  assert.match(taggedPanel,/OK\. We’ll notify you when Fit Reports from people close to your measurements are posted\./);
});

test("mobile tagged quick view stays readable inside the safe-area modal",()=>{
  assert.match(css,/\.itemPreviewInfo\{display:grid;gap:3px;min-width:0\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewOverlay\{align-items:end;padding:10px 8px calc\(10px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewCard\{width:100%;max-height:min\(86dvh,720px\);padding:18px;border-radius:18px\}/);
});
