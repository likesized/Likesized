import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route=fs.readFileSync("app/api/outfits/[id]/tagged-fit/route.ts","utf8");

test("tagged FITuition never sends null Product IDs into UUID IN filters",()=>{
  assert.match(route,/ownReports\.map\(\(row\)=>row\.product_id\)\.filter\(\(id\)=>UUID\.test\(id\)\)/);
  assert.match(route,/attributeProductIds=\[\.\.\.new Set\(\[product\.id,\.\.\.ownProductIds\]\.filter\(\(id\)=>UUID\.test\(id\)\)\)\]/);
  assert.match(route,/\.in\("product_id",attributeProductIds\)/);
  assert.doesNotMatch(route,/\.in\("product_id",\[\.\.\.new Set\(\[product\.id,\.\.\.ownProductIds\]\)\]\)/);
});
