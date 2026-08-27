import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const composer=readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx",import.meta.url),"utf8");
const newPage=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const detailPage=readFileSync(new URL("../app/outfits/[id]/page.tsx",import.meta.url),"utf8");
const creatorQuickView=readFileSync(new URL("../app/outfits/[id]/CreatorQuickView.tsx",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const tagged=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const commentThread=readFileSync(new URL("../app/outfits/[id]/CommentThread.tsx",import.meta.url),"utf8");
const commentApi=readFileSync(new URL("../app/api/outfits/[id]/comments/route.ts",import.meta.url),"utf8");
const commentPageMigration=readFileSync(new URL("../supabase/migrations/20260825021000_outfit_comment_cursor_pagination.sql",import.meta.url),"utf8");
const confirmDelete=readFileSync(new URL("../app/outfits/[id]/ConfirmDeleteOutfit.tsx",import.meta.url),"utf8");
const actions=readFileSync(new URL("../app/outfits/actions.ts",import.meta.url),"utf8");
const commentComposer=readFileSync(new URL("../app/outfits/[id]/CommentComposer.tsx",import.meta.url),"utf8");
const shopRoute=readFileSync(new URL("../app/api/outfits/[id]/shop/route.ts",import.meta.url),"utf8");
const closetPage=readFileSync(new URL("../app/closet/page.tsx",import.meta.url),"utf8");
const outfitsIndex=readFileSync(new URL("../app/outfits/page.tsx",import.meta.url),"utf8");
const explorePage=readFileSync(new URL("../app/explore/page.tsx",import.meta.url),"utf8");
const profilePhoto=readFileSync(new URL("../lib/profile-photo.ts",import.meta.url),"utf8");
const universalActions=readFileSync(new URL("../components/UniversalActionBar.tsx",import.meta.url),"utf8");
const swipeLightbox=readFileSync(new URL("../components/SwipeDismissImageLightbox.tsx",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/20260824133500_new_outfit_v1_social_foundation.sql",import.meta.url),"utf8");
const commentLikesMigration=readFileSync(new URL("../supabase/migrations/20260824231500_outfit_comment_likes.sql",import.meta.url),"utf8");
const liveIdentityMigration=readFileSync(new URL("../supabase/migrations/20260824234500_live_profile_identity.sql",import.meta.url),"utf8");

test("New Outfit creator keeps canonical photo preparation and six-photo boundaries",()=>{
 assert.match(composer,/Cover photo \(required\)/);
 assert.match(composer,/Additional photos \(optional\)/);
 assert.match(composer,/Upload up to 5 additional photos/);
 assert.match(composer,/DISPLAY_MAX_BYTES = 600 \* 1024/);
 assert.match(composer,/FEED_MAX_BYTES = 220 \* 1024/);
 assert.match(composer,/image\/heic/);
 assert.match(composer,/image\/heif/);
 assert.match(composer,/photos_dirty/);
 assert.match(actions,/const shouldSyncPhotos = photosDirty \|\| !existingPost \|\| mustPromoteDraftPhotos/);
});

test("Closet picker is progressive and selection is explicit",()=>{
 assert.match(composer,/>All Garments</);
 assert.match(composer,/>Recently Added</);
 assert.match(composer,/>A–Z</);
 assert.match(composer,/closetCategory\?<select aria-label="Filter by garment type"/);
 assert.match(composer,/closetCategory&&closetType\?<select aria-label="Filter by brand"/);
 assert.match(composer,/pickerStyles\.choiceMain/);
 assert.match(composer,/setClosetPreviewId\(item\.id\)/);
 assert.match(composer,/pickerStyles\.addButton/);
 assert.match(composer,/\{added\?"✓ Added":"Add"\}/);
 assert.doesNotMatch(composer,/option value="type">Garment Type<\/option>/);
});

test("garment quick view uses real Closet detail evidence while the picker list stays compact",()=>{
 assert.match(newPage,/garment_answers/);
 assert.doesNotMatch(newPage,/product_attribute_values/);
 assert.match(newPage,/fit_reference_photos/);
 assert.match(newPage,/variant_id/);
 assert.match(newPage,/const color=item\.variant_id\?variantById\.get\(item\.variant_id\)\?\.color_label\?\?null:null/);
 assert.match(newPage,/photoUrls/);
 assert.match(newPage,/answers/);
 assert.match(newPage,/detail: \[garmentTypeLabel,`Size \$\{item\.size_label\}`,color\]\.filter\(Boolean\)\.join\(" · "\)/);
 assert.doesNotMatch(newPage,/const variationDetail=answers\.map/);
 assert.match(composer,/BRAND/);
 assert.match(composer,/ITEM \/ MODEL/);
 assert.match(composer,/GARMENT TYPE/);
 assert.match(composer,/SIZE/);
 assert.match(composer,/COLOR/);
 assert.match(composer,/FIT RESULT/);
 assert.match(composer,/closetPreview\.answers\.map/);
});

test("photo tagging and Preview Publish keep the owner-reviewed interaction",()=>{
 assert.match(composer,/Use Cover Photo Tags/);
 assert.match(composer,/className=\{styles\.compactSecondary\}/);
 assert.match(composer,/window\.scrollTo\(\{top:0,behavior:"auto"\}\)/);
 assert.match(composer,/Previous photo/);
 assert.match(composer,/Next photo/);
});

test("My Closet is the canonical owned-content hub",()=>{
 assert.match(closetPage,/My Closet sections/);
 assert.match(closetPage,/>Garments<\/Link>/);
 assert.match(closetPage,/>Outfits<\/Link>/);
 assert.match(closetPage,/>FITuition<\/Link>/);
 assert.match(closetPage,/tab === "outfits"/);
 assert.match(closetPage,/\.eq\("user_id", userId\)/);
 assert.match(closetPage,/status === "draft" \? `\/outfits\/new\?draft=/);
 assert.match(closetPage,/FITuition combines the Fit Reports and garment history in your Closet/);
 assert.match(outfitsIndex,/redirect\(`\/closet\?tab=outfits/);
 assert.doesNotMatch(outfitsIndex,/outfit_posts|feed=following|YOUR DRAFTS/);
 assert.match(newPage,/"\/closet\?tab=outfits"/);
 assert.match(newPage,/← Back to My Closet/);
});

test("profile photos are live identity instead of Outfit or comment snapshots",()=>{
 assert.match(profilePhoto,/current profiles\.avatar_url at render time/);
 assert.match(profilePhoto,/getPublicUrl/);
 assert.match(detailPage,/currentProfilePhotoUrl/);
 assert.match(detailPage,/get_public_outfit_creator/);
 assert.match(commentApi,/currentProfilePhotoUrl/);
 assert.match(commentApi,/get_outfit_comments_sorted_page/);
 assert.match(commentPageMigration,/p\.avatar_url/);
 assert.match(explorePage,/from\("profiles"\)\.select\("id,username,display_name,avatar_url"\)\.in\("id",outfitUserIds\)/);
 assert.doesNotMatch(explorePage,/profile:profiles\(username,display_name,avatar_url\)/);
 assert.match(explorePage,/outfitProfilePhotos/);
 assert.match(liveIdentityMigration,/set public = true/);
 assert.match(liveIdentityMigration,/p\.avatar_url/);
 assert.match(liveIdentityMigration,/oc\.like_count/);
 assert.match(liveIdentityMigration,/never snapshotted onto the comment/);
 assert.doesNotMatch(migration,/comment_avatar|outfit_avatar/);
});

test("opened Outfit is a direct-navigation one-photo gallery with one canonical tagged-item quick view",()=>{
 assert.match(gallery,/onPointerDown=\{pointerDown\}/);
 assert.match(gallery,/onPointerUp=\{pointerUp\}/);
 assert.match(gallery,/move\(1\)/);
 assert.match(gallery,/ArrowLeft/);
 assert.match(gallery,/likesized:open-tagged-item/);
 assert.doesNotMatch(gallery,/Full details →/);
 assert.doesNotMatch(gallery,/galleryThumb/);
 assert.doesNotMatch(gallery,/thumbnail/i);
});

test("opened Outfit uses Style Notes, Comments, and Tagged Items tabs without redundant Style Note labels",()=>{
 assert.match(detailPage,/OutfitTabs/);
 assert.match(tabs,/\["style","Style Notes"\]/);
 assert.match(tabs,/\["comments",`Comments · \$\{commentCount\}`\]/);
 assert.match(tabs,/\["tagged","Tagged Items"\]/);
 assert.match(tabs,/initialTab="style"/);
 assert.doesNotMatch(detailPage,/OUTFIT TITLE|OUTFIT TAGS|OUTFIT DESCRIPTION/);
});

test("opened Outfit creator identity opens one compact member quick view",()=>{
 assert.match(detailPage,/CreatorQuickView/);
 assert.match(creatorQuickView,/Quick view \$\{displayName\}/);
 assert.match(creatorQuickView,/Overall Match/);
 assert.match(creatorQuickView,/Tops Match/);
 assert.match(creatorQuickView,/Bottoms Match/);
 assert.match(creatorQuickView,/Total Garments/);
 assert.match(creatorQuickView,/Total Outfits/);
 assert.match(detailPage,/creatorGarmentCount/);
 assert.match(detailPage,/new Set\(\(garmentRowsResult\.data\?\?\[\]\)\.map/);
 assert.match(creatorQuickView,/View Full Profile/);
 assert.match(creatorQuickView,/action="follow"/);
 assert.match(creatorQuickView,/action="notify"/);
 assert.match(detailPage,/creatorTwin/);
 assert.doesNotMatch(detailPage,/blockMemberFromOutfit/);
});

test("universal Outfit action row is LikeLocker, Share, Report and stays separate from profile Follow",()=>{
 assert.match(detailPage,/UniversalActionBar className=\{styles\.outfitActionBar\}/);
 assert.match(detailPage,/action="likeLocker"/);
 assert.match(detailPage,/OutfitEngagementClient/);
 assert.match(detailPage,/summaryLabel="Report Outfit" iconOnly/);
 assert.match(universalActions,/likeLocker:/);
 assert.match(universalActions,/share:/);
 assert.match(universalActions,/report:/);
 assert.doesNotMatch(detailPage,/action="follow"/);
});

test("Tagged Items preview uses universal garment actions and full-size swipe-dismiss imagery",()=>{
 assert.match(tagged,/setSelectedId/);
 assert.match(tagged,/See FITuition Details →/);
 assert.match(tagged,/View Garment Detail →/);
 assert.doesNotMatch(tagged,/View Garment Details →/);
 assert.doesNotMatch(tagged,/See fit evidence/);
 assert.doesNotMatch(tagged,/View Detailed Garment Report/);
 assert.match(tagged,/action="likeLocker"/);
 assert.match(tagged,/action="wishLocker"/);
 assert.match(tagged,/action="shop"/);
 assert.match(tagged,/action="share"/);
 assert.match(tagged,/UniversalActionSummary action="report"/);
 assert.match(tagged,/SwipeDismissImageLightbox/);
 assert.match(swipeLightbox,/dy >= 70/);
 assert.match(swipeLightbox,/Escape/);
 assert.match(tagged,/\/api\/outfits\/\$\{postId\}\/shop\?product_id=/);
 assert.match(shopRoute,/retailer_listings/);
 assert.match(shopRoute,/product_url/);
 assert.doesNotMatch(shopRoute,/retailer_url/);
});

test("comments remain plain text and paginated comments preserve Like, flag, authorized delete, and commenter quick view",()=>{
 assert.match(commentComposer,/textarea/);
 assert.doesNotMatch(commentComposer,/contentEditable|execCommand|rich text/i);
 assert.match(commentApi,/LINK_PATTERN/);
 assert.match(commentApi,/export async function POST/);
 assert.match(commentApi,/export async function PATCH/);
 assert.match(commentThread,/method:"PATCH"/);
 assert.doesNotMatch(commentThread,/likeOutfitComment|unlikeOutfitComment/);
 assert.match(commentThread,/reportContent/);
 assert.match(commentThread,/comment\.canDelete/);
 assert.match(commentThread,/PersonQuickView/);
 assert.match(commentThread,/username=\{comment\.username\}/);
 assert.match(commentApi,/get_outfit_comments_sorted_page/);
 assert.match(commentPageMigration,/order by oc\.created_at desc,oc\.id desc/);
 assert.match(commentPageMigration,/can_delete boolean/);
 assert.match(commentLikesMigration,/create table public\.outfit_comment_likes/);
 assert.match(commentLikesMigration,/add column like_count/);
});

test("creator analytics and delete controls match the live-review contract",()=>{
 assert.match(detailPage,/outfit\.view_count/);
 assert.match(detailPage,/outfit\.follows_generated_count/);
 assert.match(detailPage,/ConfirmDeleteOutfit/);
 assert.match(confirmDelete,/Delete this Outfit\?/);
 assert.match(confirmDelete,/Cancel/);
 assert.doesNotMatch(detailPage,/analyticsGrid/);
 assert.doesNotMatch(detailPage,/Shop clicks are tracked internally/);
});

test("Outfit social database boundaries remain canonical",()=>{
 assert.match(migration,/create table public\.outfit_comments/);
 assert.match(migration,/drop policy if exists "owner likes outfit" on public\.outfit_likes/);
 assert.match(migration,/create policy "member likes visible outfit" on public\.outfit_likes/);
 assert.match(migration,/follow_from_outfit/);
 assert.match(migration,/record_outfit_shop_click/);
 assert.equal(existsSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url)),true);
});
