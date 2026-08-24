import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const composer = readFileSync(new URL("../app/outfits/new/OutfitComposer.tsx", import.meta.url), "utf8");
const newPage = readFileSync(new URL("../app/outfits/new/page.tsx", import.meta.url), "utf8");
const feedPage = readFileSync(new URL("../app/outfits/page.tsx", import.meta.url), "utf8");
const detailPage = readFileSync(new URL("../app/outfits/[id]/page.tsx", import.meta.url), "utf8");
const successModal = readFileSync(new URL("../app/closet/add/FitReportSuccessModal.tsx", import.meta.url), "utf8");

test("New Outfit creator copy stays compact and owner-approved", () => {
  assert.match(newPage, /Create an Outfit\./);
  assert.match(newPage, /Add photos, a few details, and the items you’re wearing\./);
  assert.match(composer, /Cover photo \(required\)/);
  assert.match(composer, /Additional photos \(optional\)/);
  assert.match(composer, /Upload up to 5 additional photos\./);
  assert.match(composer, /Tell people about the look\./);
  assert.match(composer, /Give your outfit a title/);
  assert.match(composer, /Share the details, inspiration, styling choices/);
  assert.doesNotMatch(composer, /1 required \+ up to 5 additional/);
  assert.doesNotMatch(composer, /optimized automatically/);
  assert.doesNotMatch(composer, /Make the look discoverable/);
  assert.doesNotMatch(composer, /Accessories do not need separate garment records/);
});

test("Outfit flow selects master items before optional photo hotspots", () => {
  const itemStep = composer.indexOf("4 · ITEMS IN THIS OUTFIT");
  const photoTagStep = composer.indexOf("5 · PHOTO TAGS");
  assert.ok(itemStep > -1);
  assert.ok(photoTagStep > itemStep);
  assert.match(composer, /Search your Closet/);
  assert.match(composer, /All categories/);
  assert.match(composer, /All garment types/);
  assert.match(composer, /All brands/);
  assert.match(composer, /Recently added/);
  assert.match(composer, /Clear filters/);
  assert.match(composer, /\+ Add a new garment/);
  assert.match(composer, /Load more/);
  assert.match(composer, /Selected for this Outfit/);
  assert.match(composer, /Select the items in this Outfit first\./);
});

test("Occasion, style tags, preview gallery, and comments use simplified controls", () => {
  assert.match(composer, /Choose an occasion/);
  assert.match(composer, /\+ Add another occasion/);
  assert.match(composer, /Add a style tag/);
  assert.match(composer, /Up to 3/);
  assert.match(composer, /Previous photo/);
  assert.match(composer, /Next photo/);
  assert.match(composer, /setPreviewIndex\(index\)/);
  assert.match(composer, /<strong>Comments<\/strong>/);
  assert.match(composer, /Allow people to comment on this Outfit/);
});

test("embedded garment creation returns to the same Outfit and auto-selects", () => {
  assert.match(composer, /\/closet\/add\?embed=outfit/);
  assert.match(composer, /likesized:outfit-garment-saved/);
  assert.match(successModal, /likesized:outfit-garment-saved/);
  assert.match(successModal, /Returning to your Outfit/);
  assert.match(composer, /Garment added to this Outfit\./);
});

test("drafts have a dedicated resume workspace", () => {
  assert.equal(existsSync(new URL("../app/outfits/drafts/page.tsx", import.meta.url)), true);
  assert.match(feedPage, /\/outfits\/drafts/);
  assert.match(feedPage, /YOUR DRAFTS/);
});

test("Outfit feed and detail avoid fragile nested PostgREST relationship reads", () => {
  assert.doesNotMatch(feedPage, /profile:profiles/);
  assert.doesNotMatch(detailPage, /product:products/);
  assert.doesNotMatch(detailPage, /profile:profiles/);
  assert.doesNotMatch(detailPage, /retailer_url/);
  assert.match(detailPage, /\.from\("products"\)\.select\("id,name,slug,image_url,brand_id"\)/);
  assert.match(detailPage, /\.from\("retailer_listings"\)\.select\("product_id,product_url"\)/);
  assert.match(detailPage, /\.from\("brands"\)\.select\("id,name"\)/);
  assert.match(detailPage, /Could not load Outfit garment details:/);
});

test("opened Outfit shows viewer-specific Fit Match and qualified Twin designation", () => {
  assert.match(detailPage, /fitTwinDesignation/);
  assert.match(detailPage, /p_match_category: "tops"/);
  assert.match(detailPage, /p_match_category: "bottoms"/);
  assert.match(detailPage, /% Fit Match/);
  assert.match(detailPage, /creatorTwinLabel/);
});
