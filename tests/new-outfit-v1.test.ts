import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const composer = readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx", import.meta.url), "utf8");
const newPage = readFileSync(new URL("../app/outfits/new/page.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/outfits/actions.ts", import.meta.url), "utf8");
const detail = readFileSync(new URL("../app/outfits/[id]/page.tsx", import.meta.url), "utf8");
const gallery = readFileSync(new URL("../app/outfits/[id]/OutfitGallery.tsx", import.meta.url), "utf8");
const proxy = readFileSync(new URL("../lib/supabase/proxy.ts", import.meta.url), "utf8");
const taxonomy = readFileSync(new URL("../lib/outfit-taxonomy.ts", import.meta.url), "utf8");
const socialMigration = readFileSync(new URL("../supabase/migrations/20260824133500_new_outfit_v1_social_foundation.sql", import.meta.url), "utf8");
const boundaryMigration = readFileSync(new URL("../supabase/migrations/20260824133800_canonical_public_closet_and_outfit_public_identity.sql", import.meta.url), "utf8");
const closetPage = readFileSync(new URL("../app/closet/page.tsx", import.meta.url), "utf8");
const closetEdit = readFileSync(new URL("../app/closet/[id]/edit/page.tsx", import.meta.url), "utf8");
const closetActions = readFileSync(new URL("../app/closet/edit-actions.ts", import.meta.url), "utf8");

function count(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

test("New Outfit has one canonical creator and reuses the canonical Fit Report intake", () => {
  assert.equal(existsSync(new URL("../app/outfits/new/OutfitPhotoInput.tsx", import.meta.url)), false);
  assert.doesNotMatch(newPage, /visibility|Private\s*→\s*will share|become Shared/i);
  assert.doesNotMatch(actions, /visibility|closet_visibility|update\([^)]*shared/i);
  assert.match(composer, /Add a missing garment/);
  assert.match(composer, /iframe[^>]+src="\/closet\/add"/s);
});

test("current V1 Closet UI has no per-garment Private / Shared control", () => {
  assert.doesNotMatch(closetPage, /visibility|\bPrivate\b|\bShared\b/i);
  assert.doesNotMatch(closetEdit, /Closet visibility|value="private"|value="shared"|photo_requires_shared/i);
  assert.doesNotMatch(closetActions, /name="visibility"|photo_requires_shared|visibility\s*===?\s*"private"/i);
  assert.match(boundaryMigration, /closet_items_shared_only_current_v1/);
  assert.match(boundaryMigration, /Legacy replay-compatibility column/);
});

test("creator supports the locked editorial, gallery, hotspot, draft and preview contract", () => {
  assert.match(composer, /Headline/);
  assert.match(composer, /\/100/);
  assert.match(composer, /Outfit Story/);
  assert.match(composer, /\/5,000/);
  assert.match(composer, /Additional photos/);
  assert.match(composer, /multiple/);
  assert.match(composer, /Set as Main/);
  assert.match(composer, /drag to reorder/);
  assert.match(composer, /drag its dot/);
  assert.match(composer, /Save Draft/);
  assert.match(composer, /Preview Outfit/);
  assert.match(composer, /Publish Outfit/);
  assert.match(composer, /Leave Without Saving/);
  assert.match(composer, /Keep Editing/);
  assert.match(composer, /beforeunload/);
});

test("Occasion is a fixed shared vocabulary and Style Tags remain community-created", () => {
  const required = ["Everyday", "Work", "Business Casual", "Business Formal", "School/Campus", "Brunch", "Date Night", "Dinner", "Night Out", "Party", "Wedding Guest", "Formal Event", "Concert", "Festival", "Beach", "Poolside", "Vacation/Resort", "Travel", "Gym/Workout", "Golf", "Outdoors", "Lounge/Home", "Running Errands", "Holiday/Special Occasion"];
  for (const label of required) assert.ok(taxonomy.includes(label), `missing Occasion ${label}`);
  assert.equal(count(taxonomy, " value: "), 24);
  assert.match(composer, /Style tags/);
  assert.match(composer, /up to 3/);
  assert.match(newPage, /get_outfit_style_tag_suggestions/);
});

test("published Outfit detail keeps anonymous editorial view separate from member Fit detail", () => {
  assert.match(proxy, /PUBLIC_OUTFIT/);
  assert.match(detail, /get_public_outfit_creator/);
  assert.match(detail, /get_public_outfit_comments/);
  assert.match(detail, /get_public_outfit_product_teasers/);
  assert.doesNotMatch(detail, /outfit_posts[^\n]*profile:profiles/s);
  assert.match(detail, /Sign in to see size worn and reported fit/);
  assert.match(detail, /Size \$\{report\.size_label\}/);
  assert.match(gallery, /View tagged items/);
  assert.match(detail, /openGraph/);
  assert.match(detail, /summary_large_image/);
  assert.match(boundaryMigration, /revoke select on public\.outfit_comments from anon/);
  assert.match(boundaryMigration, /get_public_outfit_creator/);
  assert.match(boundaryMigration, /get_public_outfit_comments/);
});

test("V1 social controls include comments, reporting, blocking and the locked creator analytics", () => {
  assert.match(actions, /body\.length>500/);
  assert.match(actions, /LINK_PATTERN/);
  assert.match(detail, /outfit_comment/);
  assert.match(detail, /Block member/);
  for (const metric of ["Views", "Likes", "Comments", "Shares", "Follows generated"]) assert.match(detail, new RegExp(metric));
  assert.match(detail, /Shop clicks are tracked internally by LikeSized and are not creator-facing in V1/);
  assert.match(socialMigration, /private\.outfit_shop_clicks/);
  assert.match(socialMigration, /comments_enabled/);
});

test("new photos stay private until publish transition", () => {
  assert.match(actions, /bucket="outfit-draft-photos" as const/);
  assert.match(actions, /moveDraftPhotoToPublic/);
  assert.match(actions, /cleanupNewFailedPublish/);
});
