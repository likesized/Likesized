import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tagged=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const detailStyles=readFileSync(new URL("../app/outfits/[id]/outfitDetail.module.css",import.meta.url),"utf8");
const newPage=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const composer=readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx",import.meta.url),"utf8");
const consistencyMigration=readFileSync(new URL("../supabase/migrations/20260826190000_outfit_tag_consistency.sql",import.meta.url),"utf8");

test("tagged Outfit cards preload Relevant Fit Reports before a garment is opened",()=>{
  assert.match(tagged,/const loadFitMeta=useCallback/);
  assert.match(tagged,/items\.forEach\(\(item,index\)=>\{void loadFitMeta\(item\.closetItemId,controllers\[index\]\.signal\);\}\)/);
  assert.match(tagged,/Relevant Fit Reports: Checking…/);
  assert.match(tagged,/Relevant Fit Reports: \{cachedMeta\.matchingFitReports\}/);
  assert.doesNotMatch(tagged,/if\(!selectedId\|\|!signedIn\|\|loadedFitMeta/);
});

test("normal desktop Outfit gallery has explicit Previous and Next photo controls owned by the canonical stylesheet",()=>{
  assert.match(gallery,/aria-label="Previous Outfit photo"/);
  assert.match(gallery,/aria-label="Next Outfit photo"/);
  assert.match(gallery,/Previous and Next to change photos/);
  assert.match(gallery,/styles\.galleryNav/);
  assert.match(gallery,/styles\.galleryPrev/);
  assert.match(gallery,/styles\.galleryNext/);
  assert.doesNotMatch(gallery,/aria-label="Previous Outfit photo"[^>]*style=/);
  assert.doesNotMatch(gallery,/aria-label="Next Outfit photo"[^>]*style=/);
  assert.match(detailStyles,/\.galleryNav\{/);
  assert.match(detailStyles,/\.galleryPrev\{left:10px\}/);
  assert.match(detailStyles,/\.galleryNext\{right:10px\}/);
  assert.match(gallery,/event\.stopPropagation\(\);move\(-1\)/);
  assert.match(gallery,/event\.stopPropagation\(\);move\(1\)/);
});

test("Outfit edit save heals stale hotspot-to-item relationships instead of throwing the owner-facing error",()=>{
  assert.match(consistencyMigration,/delete from public\.outfit_photo_tags t[\s\S]*not \(t\.closet_item_id=any\(v_item_ids\)\)/);
  assert.match(consistencyMigration,/if exists\(select 1 from public\.outfit_post_items oi where oi\.post_id=v_post_id and oi\.closet_item_id=v_closet_item_id\) then/);
  assert.doesNotMatch(consistencyMigration,/Hotspot garment is not tagged in this Outfit/);
});

test("Outfit picker stays compact while clicked quick view retains exact Fit Report variation answers",()=>{
  assert.match(newPage,/select\("closet_item_id,fit,created_at,garment_answers"\)/);
  assert.match(newPage,/const recordedAnswers=report\?\.garment_answers\?\?\{\}/);
  assert.match(newPage,/detail: \[garmentTypeLabel,`Size \$\{item\.size_label\}`,color\]/);
  assert.doesNotMatch(newPage,/detail: \[[^\]]*variationDetail/);
  assert.doesNotMatch(newPage,/const variationDetail=answers\.map/);
  assert.doesNotMatch(newPage,/product_attribute_values/);
  assert.match(composer,/closetPreview\.answers\.map/);
  assert.match(composer,/\{item\.detail\}<\/small>/);
});
