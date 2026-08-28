import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const taggedFit=readFileSync(new URL("../app/api/outfits/[id]/tagged-fit/route.ts",import.meta.url),"utf8");
const taggedPanel=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const fitCard=readFileSync(new URL("../components/TaggedFituitionCard.tsx",import.meta.url),"utf8");
const itemPage=readFileSync(new URL("../app/item/[slug]/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");
const pickerCss=readFileSync(new URL("../app/outfits/new/outfitPicker.module.css",import.meta.url),"utf8");

const cardStart=taggedPanel.indexOf("<div className={styles.taggedGrid}");
const quickViewStart=taggedPanel.indexOf("{selected?<div className={styles.itemPreviewOverlay}");
const cardMarkup=taggedPanel.slice(cardStart,quickViewStart);
const firstQuickViewStart=taggedPanel.indexOf("<div className={styles.itemPreviewTop}>");
const firstQuickViewEnd=taggedPanel.indexOf("{actionError?",firstQuickViewStart);
const firstQuickViewMarkup=taggedPanel.slice(firstQuickViewStart,firstQuickViewEnd);
const unsavedDialogCss=pickerCss.match(/:global\(\[role="dialog"\]\[aria-label="Unsaved Outfit"\]\)\{([^}]*)\}/)?.[1]??"";
const garmentDialogCss=pickerCss.match(/:global\(\[role="dialog"\]\[aria-label="Add a new Closet garment"\]\)\{([^}]*)\}/)?.[1]??"";

test("photo hotspots can open the canonical tagged quick view from any detail tab",()=>{
  assert.match(tabs,/tab==="style"\?<div ref=\{styleRef\}/);
  assert.match(tabs,/tab==="comments"\?comments:null/);
  assert.match(tabs,/taggedTabDormant/);
  assert.match(tabs,/\{taggedItems\}/);
  assert.doesNotMatch(tabs,/return_to/);
  assert.match(tabs,/window\.location\.assign\(`\/explore\?\$\{params\.toString\(\)\}`\)/);
  assert.match(css,/\.taggedTabDormant \.taggedGrid\{display:none\}/);
});

test("visible Relevant Fit Reports and strong aggregate use the same eligible exact evidence units",()=>{
  assert.match(taggedFit,/newestUniqueVariationEvidence/);
  assert.match(taggedFit,/objective_variant_key/);
  assert.match(taggedFit,/const relevantExact=candidates\.filter/);
  assert.match(taggedFit,/row\.historical_match_score>=STRONG_FIT_REPORT_MATCH_THRESHOLD/);
  assert.match(taggedFit,/const otherRelevantExact=relevantExact\.filter\(\(row\)=>row\.user_id!==viewerId\)/);
  assert.match(taggedFit,/const ownRelevantExact=ownReports\.filter/);
  assert.match(taggedFit,/report\.garment_condition==="normal"&&report\.product_id===product\.id&&\(report\.objective_variant_key\?\?""\)===targetVariation/);
  assert.match(taggedFit,/const ownExactReports:RelevantReport\[\]=ownRelevantExact\.map/);
  assert.match(taggedFit,/bodyMatch:null/);
  assert.match(taggedFit,/isOwn:true/);
  assert.match(taggedFit,/const relevantReports=\[\.\.\.ownExactReports,\.\.\.strongOtherReports\]/);
  assert.match(taggedFit,/matchingFitReports:relevantReports\.length/);
  assert.match(taggedFit,/const strongExactEvidence:StrongAggregateEvidence\[\]=\[/);
  assert.match(taggedFit,/\.\.\.ownRelevantExact\.map/);
  assert.match(taggedFit,/\.\.\.otherRelevantExact\.map/);
  assert.match(taggedFit,/strongFitReports:strongAggregate\(strongExactEvidence\)/);
  assert.doesNotMatch(taggedFit,/strongFitReports:strongAggregate\(otherRelevantExact/);
  assert.match(taggedFit,/source:"community"/);
  assert.match(taggedFit,/source:"closet"/);
  assert.match(taggedFit,/recommendSize\(\[\.\.\.otherEvidence,\.\.\.ownHistory\]\)/);
});

test("inline FITuition evidence distinguishes the best other-person report from the viewer's own report",()=>{
  assert.match(fitCard,/Best Available Matching Fit Report/);
  assert.match(fitCard,/MatchPercentageBadge score=\{report\.bodyMatch\} label="Body Match"/);
  assert.match(fitCard,/Your Fit Report/);
  assert.doesNotMatch(fitCard,/Your own exact report/);
});

test("approved tagged FITuition wording is locked for all recommendation states",()=>{
  assert.match(fitCard,/Not enough fit data to confidently recommend a size\./);
  assert.match(fitCard,/Our FITuition suggests: \{meta\.recommendation\.sizeLabel\}/);
  assert.match(fitCard,/Confidence: \{meta\.recommendation\.confidenceLabel\}/);
  assert.match(fitCard,/Relevant Fit Reports: \{meta\.matchingFitReports\}/);
  assert.match(fitCard,/Strong Fit Reports/);
  assert.doesNotMatch(fitCard,/I’m not confident enough to recommend a size yet\./);
  assert.doesNotMatch(fitCard,/current exact-variation evidence does not point clearly enough to one size/);
});

test("tagged FITuition batches card summaries and resolves selected failures instead of hanging forever",()=>{
  assert.match(taggedPanel,/const loadFitMeta=useCallback/);
  assert.match(taggedPanel,/loadFitSummaryBatch\(postId\)/);
  assert.match(taggedPanel,/tagged-fit-summary/);
  assert.match(taggedPanel,/fitSummaryCache/);
  assert.match(taggedPanel,/void loadFitMeta\(selectedId,controller\.signal\)/);
  assert.doesNotMatch(taggedPanel,/items\.forEach\(\(item,index\)=>\{void loadFitMeta\(item\.closetItemId,controllers\[index\]\.signal\);\}\)/);
  assert.match(taggedPanel,/fitErrors/);
  assert.match(fitCard,/FITuition couldn’t load this evidence/);
  assert.match(fitCard,/>Try again<\/button>/);
  assert.match(taggedPanel,/void loadFitMeta\(item\.closetItemId,undefined,true\)/);
});

test("zero exact Relevant Fit Reports never surfaces a tagged-item size recommendation",()=>{
  assert.match(fitCard,/const showRecommendation=Boolean\(meta\?\.recommendation&&meta\.matchingFitReports>0\)/);
  assert.match(fitCard,/showRecommendation&&meta\.recommendation/);
  assert.match(fitCard,/Not enough fit data to confidently recommend a size\./);
  assert.doesNotMatch(fitCard,/I don’t have enough useful evidence to recommend a size yet\./);
  assert.match(taggedPanel,/"Notify me"/);
  assert.match(taggedPanel,/🔔/);
  assert.match(taggedPanel,/FITuition will notify you when people close to your size post a Fit Report for this item\./);
  assert.match(taggedPanel,/Notifications on/);
  assert.doesNotMatch(fitCard,/Your relevant Closet History provides the strongest current signal/);
});

test("tagged cards stay compact while clicked garments carry tracked-variation detail",()=>{
  assert.ok(cardStart>=0&&quickViewStart>cardStart);
  assert.doesNotMatch(cardMarkup,/variationDetail/);
  assert.match(taggedPanel,/meta\?\.variationDetail\?<span className=\{quickStyles\.variationDetail\}>\{meta\.variationDetail\}<\/span>/);
});

test("first tagged-garment quick view always keeps direct full Garment Detail navigation, including zero-report Notify",()=>{
  assert.ok(firstQuickViewStart>=0&&firstQuickViewEnd>firstQuickViewStart);
  assert.match(firstQuickViewMarkup,/watchPrompt=\{renderWatchPrompt\(selected\)\}/);
  assert.match(firstQuickViewMarkup,/href=\{selected\.href\} data-full-navigation="true">See Full Details →<\/Link>/);
});

test("closest and strong FITuition evidence live directly in the first quick view with no intermediate evidence click",()=>{
  assert.match(taggedPanel,/TaggedFituitionCard/);
  assert.doesNotMatch(taggedPanel,/evidenceOpen/);
  assert.doesNotMatch(taggedPanel,/See FITuition Details →/);
  assert.doesNotMatch(taggedPanel,/View more Relevant Fit Reports →/);
  assert.doesNotMatch(taggedPanel,/previewBack/);
  assert.match(fitCard,/StrongReports groups=\{meta\.strongFitReports\}/);
  assert.match(fitCard,/groups\.flatMap/);
  assert.match(fitCard,/fit\.count/);
  assert.match(fitCard,/group\.sizeLabel/);
  assert.match(fitCard,/fit\.fitLabel/);
  assert.match(fitCard,/RelevantReport report=\{report\}/);
  assert.match(taggedPanel,/See Full Details →/);
});

test("full Garment Detail does not crash when supplemental FITuition enrichment is unavailable",()=>{
  assert.doesNotMatch(itemPage,/throw new Error\("Could not assemble FITuition evidence\."\)/);
  assert.match(itemPage,/profilesResult\.error\?\[\]:\(profilesResult\.data\?\?\[\]\)/);
  assert.match(itemPage,/productsResult\.error\?\[\]:\(productsResult\.data\?\?\[\]\)/);
  assert.match(itemPage,/snapshotResult\.error\?\[\]:snapshotResult\.data/);
  assert.match(itemPage,/attributeResult\.error\?\[\]:attributeResult\.data/);
});

test("unsaved Outfit navigation confirmation is fixed in the current viewport",()=>{
  assert.ok(unsavedDialogCss,"Unsaved Outfit dialog rule must exist");
  assert.match(unsavedDialogCss,/position:fixed!important/);
  assert.match(unsavedDialogCss,/inset:0!important/);
  assert.match(unsavedDialogCss,/place-items:center!important/);
  assert.match(unsavedDialogCss,/z-index:240!important/);
});

test("Add a new garment from the Outfit opens in the current viewport instead of at document bottom",()=>{
  assert.ok(garmentDialogCss,"Add-garment dialog rule must exist");
  assert.match(garmentDialogCss,/position:fixed!important/);
  assert.match(garmentDialogCss,/inset:0!important/);
  assert.match(garmentDialogCss,/place-items:center!important/);
  assert.match(garmentDialogCss,/z-index:240!important/);
  assert.match(pickerCss,/:global\(\[role="dialog"\]\[aria-label="Add a new Closet garment"\] iframe\)\{[^}]*height:/);
});

test("mobile tagged quick view stays readable inside the safe-area modal",()=>{
  assert.match(css,/\.itemPreviewInfo\{display:grid;gap:3px;min-width:0\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewOverlay\{align-items:end;padding:10px 8px calc\(10px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.itemPreviewCard\{width:100%;max-height:min\(86dvh,720px\);padding:18px;border-radius:18px\}/);
});
