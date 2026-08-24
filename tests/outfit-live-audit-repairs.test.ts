import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const composer=readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx",import.meta.url),"utf8");
const newPage=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const detail=readFileSync(new URL("../app/outfits/[id]/page.tsx",import.meta.url),"utf8");
const detailCss=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const tagged=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const actions=readFileSync(new URL("../app/outfits/actions.ts",import.meta.url),"utf8");
const peopleActions=readFileSync(new URL("../app/people/actions.ts",import.meta.url),"utf8");
const profile=readFileSync(new URL("../app/people/[username]/page.tsx",import.meta.url),"utf8");
const feedCss=readFileSync(new URL("../app/outfits/outfits.module.css",import.meta.url),"utf8");
const catalogFields=readFileSync(new URL("../app/closet/add/CatalogGarmentFields.tsx",import.meta.url),"utf8");
const catalogRoute=readFileSync(new URL("../app/api/catalog/search/route.ts",import.meta.url),"utf8");

test("Outfit feed uses available desktop width instead of one dead-space column",()=>{
 assert.match(feedCss,/\.feed\s*\{[^}]*column-count:\s*4/);
 assert.match(feedCss,/column-count:\s*3/);
 assert.match(feedCss,/column-count:\s*2/);
});

test("New Outfit picker uses progressive filters and explicit Add",()=>{
 assert.match(composer,/>All Garments</);
 assert.match(composer,/>Recently Added</);
 assert.match(composer,/>A–Z</);
 assert.match(composer,/closetCategory\?<select aria-label="Filter by garment type"/);
 assert.match(composer,/closetCategory&&closetType\?<select aria-label="Filter by brand"/);
 assert.match(composer,/setClosetPreviewId\(item\.id\)/);
 assert.match(composer,/\{added\?"✓ Added":"Add"\}/);
 assert.doesNotMatch(composer,/Garment Type<\/option>/);
});

test("picker quick view identifies similar garment variations before selection",()=>{
 for(const text of ["BRAND","ITEM / MODEL","GARMENT TYPE","SIZE","COLOR","FIT RESULT"])assert.match(composer,new RegExp(text.replace("/","\\/")));
 assert.match(composer,/closetPreview\.photoUrls/);
 assert.match(composer,/closetPreview\.answers/);
 assert.match(newPage,/product_attribute_values/);
 assert.match(newPage,/fit_reference_photos/);
 assert.match(newPage,/color:item\.variant_id/);
});

test("cover-tag reuse, draft responsiveness, and Preview Publish scroll are explicit",()=>{
 assert.match(composer,/Use Cover Photo Tags/);
 assert.match(composer,/photos_dirty/);
 assert.match(actions,/shouldSyncPhotos/);
 assert.match(composer,/await nextPaint\(\)/);
 assert.match(composer,/window\.scrollTo\(\{top:0,behavior:"auto"\}\)/);
});

test("embedded Brand and Item suggestions stay anchored and lightweight",()=>{
 assert.match(catalogFields,/brandSuggestionsOpen/);
 assert.match(catalogFields,/itemSuggestionDropdown/);
 assert.doesNotMatch(catalogFields,/list="brand-options"/);
 assert.match(catalogFields,/ITEM_SEARCH_DEBOUNCE_MS = 60/);
 assert.match(catalogFields,/brief=1/);
 assert.match(catalogFields,/itemSuggestionCache/);
 assert.match(catalogRoute,/const brief = url\.searchParams\.get\("brief"\) === "1"/);
 assert.match(catalogRoute,/briefProducts/);
});

test("opened gallery hides secondary photos and navigates directly on the active photo",()=>{
 assert.match(gallery,/Click, drag, or swipe the photo/);
 assert.match(gallery,/onPointerDown/);
 assert.match(gallery,/onPointerUp/);
 assert.match(gallery,/ArrowRight/);
 assert.match(gallery,/ArrowLeft/);
 assert.doesNotMatch(gallery,/galleryThumb|previewThumb/);
});

test("opened Outfit hierarchy is compact header, photo, actions, then three exclusive tabs",()=>{
 assert.match(detail,/outfitIdentityHeader/);
 assert.match(detail,/outfitIdentityPhoto/);
 assert.match(detail,/% Fit Match/);
 assert.match(detail,/creatorTwin/);
 assert.match(detail,/outfitActionBar/);
 assert.match(detail,/OutfitTabs/);
 assert.match(tabs,/Style Notes/);
 assert.match(tabs,/Comments/);
 assert.match(tabs,/Tagged Items/);
 assert.match(detail,/OUTFIT TITLE/);
 assert.match(detail,/OUTFIT TAGS/);
 assert.match(detail,/OUTFIT DESCRIPTION/);
 assert.match(detailCss,/\.outfitTabBar/);
});

test("Outfit social controls are icon-first and blocking lives on the profile",()=>{
 assert.match(detail,/aria-label=\{liked\?"Unlike Outfit":"Like Outfit"\}/);
 assert.match(detail,/title="Follow"/);
 assert.match(detail,/summaryLabel="Report Outfit" iconOnly/);
 assert.doesNotMatch(detail,/Follow \{creatorName\}/);
 assert.doesNotMatch(detail,/blockMemberFromOutfit/);
 assert.match(peopleActions,/blockPerson/);
 assert.match(profile,/Block @\{profile\.username\}/);
});

test("Tagged Items and photo hotspots preview in place before Full details navigation",()=>{
 assert.match(gallery,/setActiveGarment/);
 assert.match(gallery,/Full details →/);
 assert.match(tagged,/setSelectedId/);
 assert.match(tagged,/role="dialog"/);
 assert.match(tagged,/Full details →/);
 assert.match(tagged,/Wish Locker/);
 assert.match(tagged,/🛒/);
});

test("comments are compact plain text with Like, flag, and owner-or-author delete",()=>{
 assert.match(detail,/commentAvatar/);
 assert.match(detail,/comment\.profile\.username/);
 assert.match(detail,/likeOutfitComment/);
 assert.match(detail,/summaryLabel="Report comment" iconOnly/);
 assert.match(detail,/owner\|\|comment\.user_id===viewerId/);
 assert.doesNotMatch(detail,/blockMemberFromOutfit/);
});

test("creator tools expose only incremental analytics and destructive confirmation",()=>{
 assert.match(detail,/outfit\.view_count/);
 assert.match(detail,/outfit\.follows_generated_count/);
 assert.doesNotMatch(detail,/analyticsGrid/);
 assert.doesNotMatch(detail,/Shop clicks are tracked internally/);
 assert.match(detail,/ConfirmDeleteOutfit/);
});
