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
const taggedFit=readFileSync(new URL("../app/api/outfits/[id]/tagged-fit/route.ts",import.meta.url),"utf8");
const commentThread=readFileSync(new URL("../app/outfits/[id]/CommentThread.tsx",import.meta.url),"utf8");
const commentComposer=readFileSync(new URL("../app/outfits/[id]/CommentComposer.tsx",import.meta.url),"utf8");
const lockerActions=readFileSync(new URL("../app/likelocker/actions.ts",import.meta.url),"utf8");
const actions=readFileSync(new URL("../app/outfits/actions.ts",import.meta.url),"utf8");
const peopleActions=readFileSync(new URL("../app/people/actions.ts",import.meta.url),"utf8");
const profile=readFileSync(new URL("../app/people/[username]/page.tsx",import.meta.url),"utf8");
const closetPage=readFileSync(new URL("../app/closet/page.tsx",import.meta.url),"utf8");
const closetCss=readFileSync(new URL("../app/closet/closet.module.css",import.meta.url),"utf8");
const globals=readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
const outfitsIndex=readFileSync(new URL("../app/outfits/page.tsx",import.meta.url),"utf8");
const explore=readFileSync(new URL("../app/explore/page.tsx",import.meta.url),"utf8");
const profilePhoto=readFileSync(new URL("../lib/profile-photo.ts",import.meta.url),"utf8");
const liveIdentityMigration=readFileSync(new URL("../supabase/migrations/20260824234500_live_profile_identity.sql",import.meta.url),"utf8");
const catalogFields=readFileSync(new URL("../app/closet/add/CatalogGarmentFields.tsx",import.meta.url),"utf8");
const catalogRoute=readFileSync(new URL("../app/api/catalog/search/route.ts",import.meta.url),"utf8");

test("My Closet owns member Garments, Outfits, and FITuition",()=>{
 assert.match(closetPage,/My Closet sections/);
 assert.match(closetPage,/>Garments<\/Link>/);
 assert.match(closetPage,/>Outfits<\/Link>/);
 assert.match(closetPage,/>FITuition<\/Link>/);
 assert.match(closetPage,/\.eq\("user_id", userId\)/);
 assert.match(closetPage,/Published looks and drafts/);
 assert.match(outfitsIndex,/\/closet\?tab=outfits/);
 assert.doesNotMatch(outfitsIndex,/outfit_posts|feed=following/);
 assert.match(closetCss,/@media\(max-width:620px\).*outfitGrid\{grid-template-columns:repeat\(2/s);
 assert.match(closetCss,/@media\(max-width:420px\).*outfitCard\{display:grid/s);
});

test("current profile identity resolves live across owned, discovered, opened, and commented Outfits",()=>{
 assert.match(profilePhoto,/current profiles\.avatar_url at render time/);
 assert.match(closetPage,/currentProfilePhotoUrl/);
 assert.match(explore,/profile:profiles\(username,display_name,avatar_url\)/);
 assert.match(explore,/currentProfilePhotoUrl/);
 assert.match(detail,/get_public_outfit_creator/);
 assert.match(detail,/get_public_outfit_comments/);
 assert.match(detail,/currentProfilePhotoUrl/);
 assert.match(liveIdentityMigration,/p\.avatar_url/);
 assert.match(liveIdentityMigration,/set public = true/);
 assert.match(liveIdentityMigration,/never snapshotted onto the comment/);
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

test("opened gallery is one compact active image and restores tags on that exact image",()=>{
 assert.match(gallery,/galleryMedia/);
 assert.match(gallery,/current\.tags\.map/);
 assert.match(gallery,/galleryTagToggle/);
 assert.match(gallery,/onPointerDown/);
 assert.match(gallery,/onPointerUp/);
 assert.match(gallery,/ArrowRight/);
 assert.match(gallery,/ArrowLeft/);
 assert.doesNotMatch(gallery,/galleryThumb|previewThumb/);
 assert.match(detailCss,/\.galleryMedia\{position:relative;display:inline-block/);
 assert.match(detailCss,/max-height:min\(66vh,580px\)/);
});

test("opened Outfit hierarchy is compact header, photo-attached actions, then three exclusive tabs",()=>{
 assert.match(detail,/outfitIdentityHeader/);
 assert.match(detail,/outfitIdentityPhoto/);
 assert.match(detail,/% Fit Match/);
 assert.match(detail,/creatorTwin/);
 assert.match(detail,/outfitActionBar/);
 assert.match(detail,/OutfitTabs/);
 assert.match(tabs,/Style Notes/);
 assert.match(tabs,/Comments ·/);
 assert.match(tabs,/Tagged Items/);
 assert.doesNotMatch(detail,/OUTFIT TITLE|OUTFIT TAGS|OUTFIT DESCRIPTION/);
 assert.doesNotMatch(detail,/engagementCounts/);
 assert.match(detailCss,/\.openOutfit\{width:min\(100%,680px\)/);
 assert.match(detailCss,/\.outfitActionBar\{display:flex;align-items:center;justify-content:flex-end/);
});

test("Outfit social controls stay with media, counts stay with actions, and owners get Share only",()=>{
 assert.match(detail,/!owner\?<></);
 assert.match(detail,/actionCount\}\>\{outfit\.like_count\}/);
 assert.match(detail,/shareCount=\{outfit\.share_count\}/);
 assert.match(detail,/title="Follow"/);
 assert.match(detail,/summaryLabel="Report Outfit" iconOnly/);
 assert.doesNotMatch(detail,/Follow \{creatorName\}/);
 assert.doesNotMatch(detail,/blockMemberFromOutfit/);
 assert.match(peopleActions,/blockPerson/);
 assert.match(profile,/Block @\{profile\.username\}/);
});

test("Tagged Items cards show identity, category, photo, and matching Fit Report count only",()=>{
 assert.match(tagged,/Matching Fit Reports:/);
 assert.match(tagged,/meta\?\.category/);
 assert.match(tagged,/item\.imageUrl/);
 assert.doesNotMatch(tagged,/Just right|size worn|Fit Result/);
 assert.match(taggedFit,/get_product_fit_summary/);
});

test("Tagged quick view adds FITuition and actions without closing on Like or Wish Locker",()=>{
 assert.match(tagged,/FITuition needs more useful evidence/);
 assert.match(tagged,/See the evidence we have/);
 assert.match(tagged,/Wish Locker/);
 assert.match(tagged,/>Shop<\/Link>/);
 assert.match(tagged,/>Share<\/button>/);
 assert.match(tagged,/<summary>Report<\/summary>/);
 assert.match(tagged,/stay_open","1"/);
 assert.match(lockerActions,/stayOpen/);
 assert.match(lockerActions,/if \(stayOpen\) return/);
 assert.match(taggedFit,/recommendSize/);
 assert.match(taggedFit,/recommendation\.confidence>=45/);
});

test("comments preview scales into a dedicated progressive sheet with a bottom composer",()=>{
 assert.match(commentThread,/PAGE_SIZE=20/);
 assert.match(commentThread,/View all \$\{commentCount\}/);
 assert.match(commentThread,/Load earlier comments/);
 assert.match(commentThread,/commentsSheetFooter/);
 assert.match(detail,/comments=1/);
 assert.match(detail,/commentTextRow/);
 assert.match(detail,/comment\.profile\.username/);
 assert.match(detail,/likeOutfitComment/);
 assert.match(detail,/summaryLabel="Report comment" iconOnly/);
 assert.match(detail,/owner\|\|comment\.user_id===viewerId/);
 assert.doesNotMatch(commentComposer,/Plain text only|GIFs|external links/);
 assert.match(detailCss,/\.commentIdentity a\{display:grid/);
 assert.match(detailCss,/\.commentsSheetFooter\{position:sticky;bottom:0/);
});

test("compact controls are the site default instead of oversized pills",()=>{
 assert.match(globals,/\.primaryButton, \.secondaryButton \{[^}]*padding:9px 14px/s);
 assert.match(globals,/input, select, textarea \{[^}]*padding:10px 12px/s);
 assert.match(globals,/\.pageShell \{ padding:52px 7vw/);
});

test("creator tools expose only incremental analytics and destructive confirmation",()=>{
 assert.match(detail,/outfit\.view_count/);
 assert.match(detail,/outfit\.follows_generated_count/);
 assert.doesNotMatch(detail,/analyticsGrid/);
 assert.doesNotMatch(detail,/Shop clicks are tracked internally/);
 assert.match(detail,/ConfirmDeleteOutfit/);
});
