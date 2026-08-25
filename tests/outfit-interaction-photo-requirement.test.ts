import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const addPage=readFileSync(new URL("../app/closet/add/page.tsx",import.meta.url),"utf8");
const addAction=readFileSync(new URL("../app/closet/add/actions.ts",import.meta.url),"utf8");
const catalogFields=readFileSync(new URL("../app/closet/add/CatalogGarmentFields.tsx",import.meta.url),"utf8");
const photoFields=readFileSync(new URL("../app/closet/add/FitReportPhotoFields.tsx",import.meta.url),"utf8");
const fitForm=readFileSync(new URL("../app/closet/add/FitReportForm.tsx",import.meta.url),"utf8");
const closet=readFileSync(new URL("../app/closet/page.tsx",import.meta.url),"utf8");
const newOutfit=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const pickerCss=readFileSync(new URL("../app/outfits/new/outfitPicker.module.css",import.meta.url),"utf8");
const outfitPage=readFileSync(new URL("../app/outfits/[id]/page.tsx",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const tagged=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const comments=readFileSync(new URL("../app/outfits/[id]/CommentThread.tsx",import.meta.url),"utf8");
const commentComposer=readFileSync(new URL("../app/outfits/[id]/CommentComposer.tsx",import.meta.url),"utf8");
const commentApi=readFileSync(new URL("../app/api/outfits/[id]/comments/route.ts",import.meta.url),"utf8");
const lockerActions=readFileSync(new URL("../app/likelocker/actions.ts",import.meta.url),"utf8");
const reportForm=readFileSync(new URL("../components/ReportContentForm.tsx",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/20260825152000_outfit_public_hotspots_and_comment_sorting.sql",import.meta.url),"utf8");

test("new Fit Reports require one identification or Fit Photo on client and server",()=>{
  assert.match(addPage,/addGarmentWithPhotoRequirement/);
  assert.match(addPage,/FitReportPhotoFields/);
  assert.match(catalogFields,/name="product_photo"/);
  for(const name of ["photo_front","photo_back"]){assert.match(photoFields,new RegExp(name));}
  for(const name of ["product_photo","photo_front","photo_back"]){assert.match(addAction,new RegExp(name));assert.match(fitForm,new RegExp(name));}
  assert.match(photoFields,/at least one required/);
  assert.match(photoFields,/Product Photo, Front Fit Photo, or Back Fit Photo/);
  assert.match(addAction,/photo_required/);
  assert.match(fitForm,/validatePhotoRequirement/);
});

test("Fit Report display images prefer Front then Product then Back",()=>{
  assert.match(closet,/const chosen=frontUrl\|\|productUrl\|\|backUrl/);
  assert.match(newOutfit,/\[frontUrl,productUrl,backUrl\]/);
  assert.match(newOutfit,/product_photo_evidence/);
  assert.match(newOutfit,/catalog-submission-photos/);
  assert.match(pickerCss,/photoRail img:first-child/);
  assert.match(pickerCss,/width:min\(190px,56vw\)/);
  assert.match(pickerCss,/object-fit:contain/);
});

test("published Outfit hotspots remain public while personalized fit stays gated",()=>{
  assert.match(migration,/get_public_outfit_tagged_items/);
  assert.match(migration,/get_public_outfit_hotspots/);
  assert.match(migration,/grant execute[\s\S]*to anon, authenticated/);
  assert.match(outfitPage,/get_public_outfit_tagged_items/);
  assert.match(outfitPage,/get_public_outfit_hotspots/);
  assert.doesNotMatch(outfitPage,/canViewTags=/);
  assert.doesNotMatch(gallery,/canViewTags/);
  assert.match(gallery,/current\.tags\.map/);
  assert.match(tagged,/if\(signedIn\)setSelectedId\(item\.closetItemId\);else setGateItem\(item\)/);
});

test("Outfit photos open a full-size viewer without stealing tag or Caption clicks",()=>{
  assert.match(gallery,/setLightboxOpen\(true\)/);
  assert.match(gallery,/role="dialog"/);
  assert.match(gallery,/Close full-size photo/);
  assert.match(gallery,/Previous photo/);
  assert.match(gallery,/Next photo/);
  assert.match(gallery,/dy>=70/);
  assert.match(gallery,/openTaggedItem\(tag\.closetItemId\)/);
  assert.match(gallery,/event\.stopPropagation\(\);setShowCaption/);
});

test("report reasons require an explicit choice instead of defaulting Other",()=>{
  for(const source of [reportForm,tagged,comments]){
    assert.match(source,/defaultValue="" required/);
    assert.match(source,/Select a reason/);
    assert.doesNotMatch(source,/defaultValue="other"/);
  }
});

test("tagged Like and Wish updates do not share a transition or revalidate the open Outfit",()=>{
  assert.doesNotMatch(tagged,/useTransition/);
  assert.match(tagged,/likePending/);
  assert.match(tagged,/wishPending/);
  assert.match(tagged,/setLiked[\s\S]*await \(next\?likeProduct:unlikeProduct\)/);
  assert.match(tagged,/setWished[\s\S]*await \(next\?addToWishLocker:removeFromWishLocker\)/);
  assert.ok(lockerActions.indexOf("if (stayOpen) return;")<lockerActions.indexOf('revalidatePath("/explore")'));
});

test("comments default to Top, can switch to Newest, and mutate without page navigation",()=>{
  assert.match(migration,/get_outfit_comments_sorted_page/);
  assert.match(migration,/case when p_sort = 'top' then oc\.like_count end desc/);
  assert.match(comments,/useState<SortMode>\("top"\)/);
  assert.match(comments,/>Top<\/button>/);
  assert.match(comments,/>Newest<\/button>/);
  assert.match(commentApi,/get_outfit_comments_sorted_page/);
  assert.match(commentApi,/export async function POST/);
  assert.match(commentApi,/export async function PATCH/);
  assert.match(commentComposer,/fetch\(`\/api\/outfits\/\$\{postId\}\/comments`/);
  assert.doesNotMatch(commentComposer,/action=\{addOutfitComment\}/);
  assert.match(comments,/method:"PATCH"/);
  assert.doesNotMatch(comments,/likeOutfitComment|unlikeOutfitComment/);
});
