import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const newPage=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const composer=readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const detailPage=readFileSync(new URL("../app/outfits/[id]/page.tsx",import.meta.url),"utf8");
const tagged=readFileSync(new URL("../app/outfits/[id]/TaggedItemsPanel.tsx",import.meta.url),"utf8");
const universalActions=readFileSync(new URL("../components/UniversalActionBar.tsx",import.meta.url),"utf8");
const captionAction=readFileSync(new URL("../app/outfits/photo-caption-actions.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../supabase/migrations/20260825122000_outfit_photo_captions.sql",import.meta.url),"utf8");
const closet=readFileSync(new URL("../app/closet/page.tsx",import.meta.url),"utf8");

test("New Outfit uses the same garment identity metadata before selection and during photo tagging",()=>{
  assert.match(newPage,/detail: \[garmentTypeLabel,`Size \$\{item\.size_label\}`,color\]\.filter\(Boolean\)\.join\(" · "\)/);
  assert.match(composer,/className=\{pickerStyles\.choiceMain\}[\s\S]*<small>\{item\.detail\}<\/small>/);
  assert.match(composer,/className=\{styles\.selectedClosetItems\}[\s\S]*<small>\{item\.detail\}<\/small>/);
  assert.match(composer,/className=\{styles\.hotspotChoices\}[\s\S]*<small>\{item\.detail\}<\/small>/);
  assert.doesNotMatch(newPage,/detail: `Size \$\{item\.size_label\}\$\{report/);
});

test("Outfit photos support optional 200-character captions without permanently covering the photo",()=>{
  assert.match(migration,/add column caption text/);
  assert.match(migration,/char_length\(caption\) <= 200/);
  assert.match(composer,/maxLength=\{200\}/);
  assert.match(captionAction,/input\.caption\.length>200/);
  assert.match(newPage,/sort_order,is_main,caption/);
  assert.match(detailPage,/sort_order,is_main,caption/);
  assert.match(gallery,/showCaption/);
  assert.match(gallery,/>Caption<\/button>/);
  assert.match(gallery,/current\.caption&&showCaption/);
});

test("Wish Locker remains an explicit universal garment action",()=>{
  assert.match(tagged,/UniversalActionButton action="wishLocker"/);
  assert.match(universalActions,/wishLocker:\{label:"Wish Locker"/);
  assert.match(universalActions,/Remove from Wish Locker/);
  assert.match(universalActions,/Add to Wish Locker/);
});

test("Closet Outfit cards use matched vector icon boxes for likes and comments",()=>{
  const svgCount=(closet.match(/<svg viewBox="0 0 24 24"/g)??[]).length;
  assert.equal(svgCount,2);
  assert.doesNotMatch(closet,/💬 \{outfit\.comment_count\}/);
});
