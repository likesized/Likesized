import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { canonicalOutfitWebp } from "../lib/outfit-photo-server.ts";
import { outfitFeedPhotoPath } from "../lib/outfit-photo-paths.ts";

test("legacy feed helper remains compatible for existing Outfit photo paths", () => {
  assert.equal(outfitFeedPhotoPath("member/post/display.webp"), "member/post/feed.webp");
  assert.equal(outfitFeedPhotoPath("member/post/outfit.jpg"), "member/post/outfit.jpg");
});

test("gallery upload enforces optimized WebP display and feed boundaries", () => {
  const actions = readFileSync(new URL("../app/outfits/actions.ts", import.meta.url), "utf8");
  const composer = readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx", import.meta.url), "utf8");
  const serverNormalizer = readFileSync(new URL("../lib/outfit-photo-server.ts", import.meta.url), "utf8");
  assert.match(actions, /photo_display__/);
  assert.match(actions, /photo_feed__/);
  assert.match(actions, /600\s*\*\s*1024/);
  assert.match(actions, /220\s*\*\s*1024/);
  assert.match(actions, /outfit-draft-photos/);
  assert.match(actions, /moveDraftPhotoToPublic/);
  assert.match(actions, /canonicalOutfitWebp/);
  assert.match(composer, /multiple/);
  assert.match(composer, /photos\.length\s*>=\s*6/);
  assert.match(composer, /Set as cover/);
  assert.match(composer, /draggable/);
  assert.match(composer, /canvasWebpSupported/);
  assert.match(composer, /image\/jpeg/);
  assert.match(serverNormalizer, /metadata\.format === "webp"/);
  assert.match(serverNormalizer, /\.webp\(\{ quality \}\)/);
});

test("Safari JPEG transport fallback is normalized to real WebP before storage", async () => {
  const jpeg = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 120, g: 140, b: 160 } },
  }).jpeg({ quality: 80 }).toBuffer();
  const transport = new File([jpeg], "display.webp", { type: "image/webp" });
  const normalized = await canonicalOutfitWebp(transport, 600 * 1024);
  const metadata = await sharp(normalized).metadata();
  assert.equal(metadata.format, "webp");
  assert.ok(normalized.byteLength <= 600 * 1024);
});

test("discovered Outfits and Style Feed keep feed derivatives while in-card and full-size galleries use display images", () => {
  const explore = readFileSync(new URL("../app/explore/page.tsx", import.meta.url), "utf8");
  const outfitsIndex = readFileSync(new URL("../app/outfits/page.tsx", import.meta.url), "utf8");
  const circle = readFileSync(new URL("../app/circle/page.tsx", import.meta.url), "utf8");
  const gallery = readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx", import.meta.url), "utf8");
  assert.match(explore, /outfitFeedPhotoPath\(post\.photo_url\)/);
  assert.match(explore, /storage\.from\("outfit-photos"\)\.createSignedUrl\(feedPath/);
  assert.match(circle, /row\.feed_path\|\|outfitFeedPhotoPath\(row\.display_path\)/);
  assert.match(circle, /storage\.from\("outfit-photos"\)\.getPublicUrl\(row\.display_path\)/);
  assert.match(circle, /storage\.from\("outfit-photos"\)\.getPublicUrl\(previewPath\)/);
  assert.doesNotMatch(circle, /createSignedUrl/);
  assert.doesNotMatch(gallery, /src=\{current\.previewUrl\?\?current\.url\}/);
  assert.match(gallery, /src=\{current\.url\}/);
  assert.doesNotMatch(gallery, /stableStageHeight|62dvh|height:stableStageHeight/);
  assert.match(gallery, /overflow:"auto"/);
  assert.doesNotMatch(gallery, /stageHeights|syncStageHeight|activeImageElement|previousImageElement|nextImageElement/);
  assert.match(outfitsIndex, /\/closet\?tab=outfits/);
  assert.doesNotMatch(outfitsIndex, /outfitFeedPhotoPath|feedPath/);
});

test("retired one-photo creator is not left beside the canonical gallery composer", () => {
  assert.equal(existsSync(new URL("../app/outfits/new/OutfitPhotoInput.tsx", import.meta.url)), false);
});
