import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const likeRoute=readFileSync("app/api/outfits/[id]/like/route.ts","utf8");
const likeButton=readFileSync("app/circle/StyleFeedLikeButton.tsx","utf8");

test("Style Feed Like accepts database-valid UUID-shaped Outfit ids",()=>{
  assert.match(likeRoute,/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$/);
  assert.doesNotMatch(likeRoute,/\[1-5\]\[0-9a-f\]\{3\}/);
  assert.match(likeButton,/setLiked\(nextLiked\)/);
  assert.match(likeButton,/setLiked\(previousLiked\)/);
});
