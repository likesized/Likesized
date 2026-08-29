import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const taggedItemsRoute=readFileSync("app/api/outfits/[id]/tagged-items/route.ts","utf8");
const taggedItemsLoader=readFileSync("app/circle/StyleFeedGarments.tsx","utf8");
const styleFeedBoard=readFileSync("app/circle/StyleFeedBoard.tsx","utf8");

test("Style Feed tagged-items route accepts database-valid UUID-shaped Outfit ids",()=>{
  assert.match(taggedItemsRoute,/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$/);
  assert.doesNotMatch(taggedItemsRoute,/\[1-5\]\[0-9a-f\]\{3\}/);
  assert.doesNotMatch(taggedItemsRoute,/\[89ab\]\[0-9a-f\]\{3\}/);
});

test("Style Feed garment recovery never exposes raw retry wording",()=>{
  assert.doesNotMatch(taggedItemsLoader,/Retry garments/);
  assert.match(taggedItemsLoader,/>View Garments →<\/button>/);
});

test("Style Feed reuses resolved garment data for photo hotspots",()=>{
  assert.match(taggedItemsLoader,/onItems\?:\(items:StyleFeedGarmentItem\[\]\)=>void/);
  assert.match(styleFeedBoard,/onItems=\{setGalleryGarments\}/);
  assert.match(styleFeedBoard,/garments=\{galleryGarments\.map/);
  assert.doesNotMatch(styleFeedBoard,/OutfitGallery photos=\{active\.photos\} garments=\{\[\]\}/);
});
