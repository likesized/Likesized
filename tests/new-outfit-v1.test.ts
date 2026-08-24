import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const composer=readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx",import.meta.url),"utf8");
const newPage=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const detailPage=readFileSync(new URL("../app/outfits/[id]/page.tsx",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const tabs=readFileSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url),"utf8");
const tagged=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const confirmDelete=readFileSync(new URL("../app/outfits/[id]/ConfirmDeleteOutfit.tsx",import.meta.url),"utf8");
const actions=readFileSync(new URL("../app/outfits/actions.ts",import.meta.url),"utf8");
const commentComposer=readFileSync(new URL("../app/outfits/[id]/CommentComposer.tsx",import.meta.url),"utf8");
const shopRoute=readFileSync(new URL("../app/api/outfits/[id]/shop/route.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/20260824133500_new_outfit_v1_social_foundation.sql",import.meta.url),"utf8");
const hardeningMigration=readFileSync(new URL("../supabase/migrations/20260824133700_harden_new_outfit_v1_social_controls.sql",import.meta.url),"utf8");
const commentLikesMigration=readFileSync(new URL("../supabase/migrations/20260824231500_outfit_comment_likes.sql",import.meta.url),"utf8");

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

test("garment quick view uses real Closet detail evidence",()=>{
 assert.match(newPage,/product_attribute_values/);
 assert.match(newPage,/fit_reference_photos/);
 assert.match(newPage,/variant_id/);
 assert.match(newPage,/color:item\.variant_id/);
 assert.match(newPage,/photoUrls/);
 assert.match(newPage,/answers/);
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

test("opened Outfit is a direct-navigation one-photo gallery with no secondary thumbnail strip",()=>{
 assert.match(gallery,/onPointerDown=\{pointerDown\}/);
 assert.match(gallery,/onPointerUp=\{pointerUp\}/);
 assert.match(gallery,/move\(1\)/);
 assert.match(gallery,/ArrowLeft/);
 assert.match(gallery,/Full details →/);
 assert.doesNotMatch(gallery,/galleryThumb/);
 assert.doesNotMatch(gallery,/thumbnail/i);
});

test("opened Outfit uses Style Notes, Comments, and Tagged Items tabs",()=>{
 assert.match(detailPage,/OutfitTabs/);
 assert.match(tabs,/\["style","Style Notes"\]/);
 assert.match(tabs,/\["comments","Comments"\]/);
 assert.match(tabs,/\["tagged","Tagged Items"\]/);
 assert.match(tabs,/initialTab="style"/);
 assert.match(detailPage,/OUTFIT TITLE/);
 assert.match(detailPage,/OUTFIT TAGS/);
 assert.match(detailPage,/OUTFIT DESCRIPTION/);
});

test("opened Outfit creator header and social row stay compact and contextual",()=>{
 assert.match(detailPage,/outfitIdentityPhoto/);
 assert.match(detailPage,/outfitNameLine/);
 assert.match(detailPage,/% Fit Match/);
 assert.match(detailPage,/creatorTwin/);
 assert.match(detailPage,/outfitActionBar/);
 assert.match(detailPage,/aria-label=\{liked\?"Unlike Outfit":"Like Outfit"\}/);
 assert.match(detailPage,/title="Follow"/);
 assert.match(detailPage,/summaryLabel="Report Outfit" iconOnly/);
 assert.doesNotMatch(detailPage,/Follow \{creatorName\}/);
 assert.doesNotMatch(detailPage,/blockMemberFromOutfit/);
});

test("Tagged Items preview before navigation and uses Like, Wish Locker, and cart actions",()=>{
 assert.match(tagged,/setSelectedId/);
 assert.match(tagged,/Full details →/);
 assert.match(tagged,/Wish Locker/);
 assert.match(tagged,/🛒/);
 assert.match(tagged,/\/api\/outfits\/\$\{postId\}\/shop\?product_id=/);
 assert.match(shopRoute,/retailer_listings/);
 assert.match(shopRoute,/product_url/);
 assert.doesNotMatch(shopRoute,/retailer_url/);
});

test("comments remain plain text and each comment has Like, flag, and authorized delete",()=>{
 assert.match(commentComposer,/textarea/);
 assert.doesNotMatch(commentComposer,/contentEditable|execCommand|rich text/i);
 assert.match(actions,/LINK_PATTERN/);
 assert.match(actions,/likeOutfitComment/);
 assert.match(actions,/unlikeOutfitComment/);
 assert.match(detailPage,/targetType="outfit_comment"/);
 assert.match(detailPage,/summaryLabel="Report comment" iconOnly/);
 assert.match(detailPage,/owner\|\|comment\.user_id===viewerId/);
 assert.match(detailPage,/\/people\/\$\{comment\.profile\.username\}/);
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
 assert.match(migration,/create table public\.outfit_likes/);
 assert.match(hardeningMigration,/follow_from_outfit/);
 assert.match(hardeningMigration,/record_outfit_shop_click/);
 assert.equal(existsSync(new URL("../app/outfits/[id]/OutfitTabs.tsx",import.meta.url)),true);
});
