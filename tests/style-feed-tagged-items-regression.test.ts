import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const taggedItemsRoute=readFileSync("app/api/outfits/[id]/tagged-items/route.ts","utf8");

test("Style Feed tagged-items route accepts database-valid UUID-shaped Outfit ids",()=>{
  assert.match(taggedItemsRoute,/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$/);
  assert.doesNotMatch(taggedItemsRoute,/\[1-5\]\[0-9a-f\]\{3\}/);
  assert.doesNotMatch(taggedItemsRoute,/\[89ab\]\[0-9a-f\]\{3\}/);
});
