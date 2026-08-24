import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { outfitFeedPhotoPath } from "../lib/outfit-photo-paths.ts";

test("legacy feed helper remains compatible for existing Style Feed rows", () => {
  assert.equal(outfitFeedPhotoPath("member/post/display.webp"), "member/post/feed.webp");
  assert.equal(outfitFeedPhotoPath("member/post/outfit.jpg"), "member/post/outfit.jpg");
});

test("gallery upload enforces optimized WebP display and feed boundaries", () => {
  const actions = readFileSync(new URL("../app/outfits/actions.ts", import.meta.url), "utf8");
  const composer = readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx", import.meta.url), "utf8");
  assert.match(actions, /photo_display__/);
  assert.match(actions, /photo_feed__/);
  assert.match(actions, /600\s*\*\s*1024/);
  assert.match(actions, /220\s*\*\s*1024/);
  assert.match(actions, /outfit-draft-photos/);
  assert.match(actions, /moveDraftPhotoToPublic/);
  assert.match(composer, /multiple/);
  assert.match(composer, /photos\.length>=6|photos\.length\s*>=\s*6/);
  assert.match(composer, /Set as Main/);
  assert.match(composer, /draggable/);
});

test("new Outfit feed serves feed derivatives while legacy circle compatibility remains", () => {
  const outfits = readFileSync(new URL("../app/outfits/page.tsx", import.meta.url), "utf8");
  const circle = readFileSync(new URL("../app/circle/page.tsx", import.meta.url), "utf8");
  assert.match(outfits, /replace\(\/\\\/display\\\.webp\$\/,\s*"\/feed\.webp"\)/);
  assert.match(outfits, /getPublicUrl\(feedPath\)/);
  assert.match(circle, /outfitFeedPhotoPath\(row\.outfit_photo_path!\)/);
});

test("retired one-photo creator is not left beside the canonical gallery composer", () => {
  assert.equal(existsSync(new URL("../app/outfits/new/OutfitPhotoInput.tsx", import.meta.url)), false);
});
