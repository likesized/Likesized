import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const taggedFit=readFileSync(new URL("../app/api/outfits/[id]/tagged-fit/route.ts",import.meta.url),"utf8");
const taggedPanel=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");
const pickerCss=readFileSync(new URL("../app/outfits/new/outfitPicker.module.css",import.meta.url),"utf8");

const cardStart=taggedPanel.indexOf("<div className={styles.taggedGrid}");
const quickViewStart=taggedPanel.indexOf("{selected?<div className={styles.itemPreviewOverlay}");
const cardMarkup=taggedPanel.slice(cardStart,quickViewStart);
const unsavedDialogCss=pickerCss.match(/:global\(\[role="dialog"\]\[aria-label="Unsaved Outfit"\]\)\{([^}]*)\}/)?.[1]??"";

test("photo hotspots can open the canonical tagged quick view from any detail tab",()=>{
  assert.match(tabs,/tab==="style"\?<div ref=\{styleRef\}/);
  assert.match(tabs,/tab==="comments"\?comments:null/);
  assert.match(tabs,/taggedTabDormant/);
  assert.match(tabs,/\{taggedItems\}/);
  assert.doesNotMatch(tabs,/return_to/);
  assert.match(tabs,/window\.location\.assign\(`\/explore\?\$\{params\.toString\(\)\}`\)/);
  assert.match(css,/\.taggedTabDormant \.taggedGrid\{display:none\}/);
});

test("visible Relevant Fit Reports exclude the viewer while own Closet history remains recommendation evidence",()=>{
  assert.match(taggedFit,/newestUniqueVariationEvidence/);
  assert.match(taggedFit,/objective_variant_key/);
  assert.match(taggedFit,/const relevantExact=candidates\.filter/);
  assert.match(taggedFit,/row\.historical_match_score>=STRONG_FIT_REPORT_MATCH_THRESHOLD/);
  assert.match(taggedFit,/const otherRelevantExact=relevantExact\.filter\(\(row\)=>row\.user_id!==viewerId\)/);
  assert.match(taggedFit,/const relevantReports=strongOtherReports/);
  assert.match(taggedFit,/matchingFitReports:relevantReports\.length/);
  assert.match(taggedFit,/strongFitReports:strongAggregate\(otherRelevantExact/);
  assert.doesNotMatch(taggedFit,/const relevantReports=\[\.\.\.ownExactReports/);
  assert.match(taggedFit,/source:"community"/);
  assert.match(taggedFit,/source:"closet"/);
  assert.match(taggedFit,/recommendSize\(\[\.\.\.otherEvidence,\.\.\.ownHistory\]\)/);
});

test("insufficient FITuition copy agrees with a positive exact-variation report count",()=>{
  assert.match(taggedPanel,/I’m not confident enough to recommend a size yet\./);
  assert.match(taggedPanel,/Relevant Fit Reports: \{meta\.matchingFitReports\}/);
  assert.match(taggedPanel,/current exact-variation evidence does not point clearly enough to one size/);
  assert.doesNotMatch(taggedPanel,/No useful exact-item Fit Reports match your Fit Profile yet/);
});

test("tagged FITuition preloads every card and resolves failures instead of hanging forever",()=>{
  assert.match(taggedPanel,/const loadFitMeta=useCallback/);
  assert.match(taggedPanel,/items\.forEach\(\(item,index\)=>\{void loadFitMeta\(item\.closetItemId,controllers\[index\]\.signal\);\}\)/);
  assert.match(taggedPanel,/fitErrors/);
  assert.match(taggedPanel,/FITuition couldn’t load this evidence/);
  assert.match(taggedPanel,/>Try again<\/button>/);
  assert.match(taggedPanel,/void loadFitMeta\(item\.closetItemId,undefined,true\)/);
  assert.doesNotMatch(taggedPanel,/if\(!selectedId\|\|!signedIn\|\|loadedFitMeta/);
});

test("zero other-wearer Relevant Fit Reports never surfaces a tagged-item size recommendation",()=>{
  assert.match(taggedPanel,/const showRecommendation=Boolean\(meta\?\.recommendation&&meta\.matchingFitReports>0\)/);
  assert.match(taggedPanel,/showRecommendation&&meta\.recommendation/);
  assert.match(taggedPanel,/I don’t have enough useful evidence to recommend a size yet\./);
  assert.match(taggedPanel,/"Notify me"/);
  assert.match(taggedPanel,/🔔/);
  assert.match(taggedPanel,/FITuition will notify you when people close to your size post a Fit Report for this item\./);
  assert.match(taggedPanel,/Notifications on/);
  assert.doesNotMatch(taggedPanel,/Your relevant Closet History provides the strongest current signal/);
});

test("tagged cards stay compact while clicked garments carry tracked-variation detail",()=>{
  assert.ok(cardStart>=0&&quickViewStart>cardStart);
  assert.doesNotMatch(cardMarkup,/variationDetail/);
  assert.match(taggedPanel,/meta\?\.variationDetail\?<span className=\{quickStyles\.variationDetail\}>\{meta\.variationDetail\}<\/span>/);
});

test("first tagged-garment quick view always keeps direct full Garment Detail navigation, including zero-report Notify",()=>{
  assert.match(taggedPanel,/renderWatchPrompt\(selected\)[\s\S]*<\/section>\s*<UniversalActionBar[\s\S]*<\/UniversalActionBar>\s*<Link[^>]*href=\{selected\.href\}[^>]*data-full-navigation="true"[^>]*>View Garment Detail →<\/Link>/);
});

test("FITuition details use one concise intermediate evidence layer before full garment navigation",()=>{
  assert.match(taggedPanel,/See FITuition Details →/);
  assert.match(taggedPanel,/FITuition DETAILS/);
  assert.match(taggedPanel,/Strong Fit Report summary/);
  assert.match(taggedPanel,/Best current match/);
  assert.match(taggedPanel,/View all \$\{meta\.relevantReports\.length\} Relevant Fit Reports →/);
  assert.match(taggedPanel,/View Garment Details →/);
  assert.doesNotMatch(taggedPanel,/Closest exact reports/);
  assert.doesNotMatch(taggedPanel,/Exact-item history · Body Match unavailable/);
  assert.doesNotMatch(taggedPanel,/View Detailed Garment Report/);
});

test("unsaved Outfit navigation confirmation is fixed in the current viewport",()=>{
  assert.ok(unsavedDialogCss,"Unsaved Outfit dialog rule must exist");
  assert.match(unsavedDialogCss,/position:fixed!important/);
  assert.match(unsavedDialogCss,/inset:0!important/);
  assert.match(unsavedDialogCss,/place-items:center!important/);
  assert.match(unsavedDialogCss,/z-index:240!important/);
});

test("mobile tagged quick view stays readable inside the safe-area modal",()=>{
  assert.match(css,/\.itemPreviewInfo\{display:grid;gap:3px;min-width:0\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewOverlay\{align-items:end;padding:10px 8px calc\(10px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewCard\{width:100%;max-height:min\(86dvh,720px\);padding:18px;border-radius:18px\}/);
});
