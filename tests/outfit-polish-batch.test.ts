import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const newPage=readFileSync(new URL("../app/outfits/new/page.tsx",import.meta.url),"utf8");
const composer=readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx",import.meta.url),"utf8");
const gallery=readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx",import.meta.url),"utf8");
const detailPage=readFileSync(new URL("../app/outfits/[id]/page.tsx",import.meta.url),"utf8");
const creatorQuickView=readFileSync(new URL("../app/outfits/[id]/CreatorQuickView.tsx",import.meta.url),"utf8");
const creatorQuickViewCss=readFileSync(new URL("../app/outfits/[id]/CreatorQuickView.module.css",import.meta.url),"utf8");
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

test("Wishlist uses one deterministic bag-and-heart SVG and never renders a count",()=>{
  assert.match(tagged,/UniversalActionButton action="wishLocker"/);
  assert.match(universalActions,/function WishLockerIcon/);
  assert.match(universalActions,/viewBox="0 0 24 24"/);
  assert.match(universalActions,/fill=\{active\?"currentColor":"none"\}/);
  assert.match(universalActions,/wishLocker:\s*\{\s*label:\s*"Wishlist"/);
  assert.match(universalActions,/inactiveAria:\s*"Add to Wishlist"/);
  assert.match(universalActions,/activeAria:\s*"Remove from Wishlist"/);
  assert.match(universalActions,/const visibleCount\s*=\s*action\s*===?\s*"wishLocker"\s*\?\s*undefined\s*:\s*count/);
  assert.doesNotMatch(universalActions,/🛍/);
  assert.doesNotMatch(tagged,/action="wishLocker"[^>]*count=/);
});

test("creator quick view uses a clean hierarchy instead of table-grid chrome",()=>{
  assert.match(creatorQuickView,/className=\{styles\.overallStat\}/);
  assert.match(creatorQuickView,/Total Garments/);
  assert.match(creatorQuickView,/Total Outfits/);
  assert.match(creatorQuickViewCss,/\.stats\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(creatorQuickViewCss,/\.stats \.overallStat\{grid-column:1\/-1/);
  assert.doesNotMatch(creatorQuickViewCss,/\.stats\{[^}]*border:/);
  assert.doesNotMatch(creatorQuickViewCss,/\.stats>div\{[^}]*border/);
});

test("Tagged garment quick view has one clear detailed garment report destination",()=>{
  assert.doesNotMatch(tagged,/See fit evidence/);
  assert.match(tagged,/>View Detailed Garment Report →<\/Link>/);
  assert.equal((tagged.match(/href=\{selected\.href\}/g)??[]).length,1);
});

test("Closet Outfit cards use matched vector icon boxes for likes and comments",()=>{
  const svgCount=(closet.match(/<svg viewBox="0 0 24 24"/g)??[]).length;
  assert.equal(svgCount,2);
  assert.doesNotMatch(closet,/💬 \{outfit\.comment_count\}/);
});
