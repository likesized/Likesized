import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { outfitFeedPhotoPath } from "../lib/outfit-photo-paths.ts";

test("new optimized outfit display paths resolve to feed siblings", () => {
  assert.equal(outfitFeedPhotoPath("member/post/display.webp"), "member/post/feed.webp");
});

test("legacy outfit paths remain readable without a migration", () => {
  assert.equal(outfitFeedPhotoPath("member/post/outfit.jpg"), "member/post/outfit.jpg");
});

test("server upload enforces optimized WebP size boundaries", () => {
  const actions = readFileSync(new URL("../app/outfits/actions.ts", import.meta.url), "utf8");
  assert.match(actions, /photo_display/);
  assert.match(actions, /photo_feed/);
  assert.match(actions, /600\s*\*\s*1024/);
  assert.match(actions, /220\s*\*\s*1024/);
  assert.match(actions, /display\.webp/);
  assert.match(actions, /feed\.webp/);
  assert.doesNotMatch(actions, /await photo\.arrayBuffer/);
});

test("both outfit feeds request feed-sized paths with fallback support", () => {
  const outfits = readFileSync(new URL("../app/outfits/page.tsx", import.meta.url), "utf8");
  const circle = readFileSync(new URL("../app/circle/page.tsx", import.meta.url), "utf8");
  assert.match(outfits, /outfitFeedPhotoPath\(post\.photo_url\)/);
  assert.match(circle, /outfitFeedPhotoPath\(row\.outfit_photo_path!\)/);
});
