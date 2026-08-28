import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/item/[slug]/page.tsx", "utf8");
const actions = readFileSync("app/item/[slug]/ItemActionsClient.tsx", "utf8");
const expanded = readFileSync("app/item/[slug]/ExpandedEvidenceClient.tsx", "utf8");
const evidenceRoute = readFileSync("app/api/items/[slug]/evidence/route.ts", "utf8");
const variation = readFileSync("lib/tracked-variation.ts", "utf8");
const likeActions = readFileSync("app/likelocker/actions.ts", "utf8");
const recommendation = readFileSync("lib/recommendation.ts", "utf8");

test("Roadmap 14 consumes tracked variation identity rather than size/color Product variants", () => {
  assert.match(page, /tracked_variation_key/);
  assert.match(page, /requestedVariation=first\(query\.variation\)/);
  assert.ok(!page.includes("product_variants"), "Garment Detail must not treat size/color/SKU rows as tracked fit variations");
  assert.ok(!page.includes("color_label"), "Color must not define the Garment Detail fit variation");
  assert.match(variation, /classification === "variation-defining"/);
  assert.match(variation, /value === "not_sure"/);
});

test("Roadmap 14 uses the shared canonical Product image resolver", () => {
  assert.match(page, /resolveCanonicalProductImages/);
  assert.match(page, /canonicalProductImageKey/);
  assert.match(page, /variationKey:selectedVariationKey/);
  assert.ok(!page.includes("product.image_url||"), "Garment Detail must not invent its own image fallback order");
});

test("Roadmap 14 keeps the compact exact, strong, related evidence hierarchy", () => {
  const exactIndex = page.indexOf("BEST EXACT VARIATION");
  const strongIndex = page.indexOf("Strong Fit Reports");
  const relatedIndex = page.indexOf("CLOSEST RELATED VARIATION");
  assert.ok(exactIndex >= 0 && strongIndex > exactIndex && relatedIndex > strongIndex);
  assert.match(page, /STRONG_FIT_REPORT_MATCH_THRESHOLD/);
  assert.match(page, /strongExact\.length>=2/);
  assert.match(page, /b\.historical_match_score-a\.historical_match_score/);
  assert.match(page, /This is the closest Fit Report we currently have for this exact variation\./);
  assert.match(page, /Body Match shows how closely your measurements match the person who submitted this Fit Report/);
});

test("related variation differences come from controlled variation-defining questions", () => {
  assert.match(page, /trackedVariationDifferences/);
  assert.match(variation, /instead of/);
  assert.ok(!variation.includes("Color"));
  assert.ok(!variation.includes("size_label"));
});

test("expanded evidence is lazy and bounded instead of eagerly dumping every report", () => {
  assert.match(page, /<ExpandedEvidenceClient/);
  assert.match(expanded, /fetch\(`\/api\/items\/\$\{encodeURIComponent\(slug\)\}\/evidence/);
  assert.match(evidenceRoute, /p_result_limit:200/);
  assert.match(evidenceRoute, /Promise\.all/);
  assert.ok(!page.includes("ranked.slice(0,30)"));
});

test("Garment Detail reuses the one canonical FITuition recommendation engine", () => {
  assert.match(page, /recommendSize\(\[\.\.\.communityEvidence,\.\.\.closetEvidence\]\)/);
  assert.match(page, /closetEvidenceRelevance/);
  assert.match(recommendation, /export function recommendSize/);
  assert.ok(!page.includes("function recommendSize"));
});

test("Garment Detail utility actions keep LikeLocker, Wishlist, Shop, Share and Report count-free", () => {
  assert.match(actions, /action="likeLocker"/);
  assert.match(actions, /action="wishLocker"/);
  assert.match(actions, /action="shop"/);
  assert.match(actions, /action="share"/);
  assert.match(actions, /action="report"/);
  assert.match(actions, /retailers\.length === 1/);
  assert.match(actions, /retailers\.length > 1/);
  assert.ok(!actions.includes("count="), "Product utility actions must not show public counts");
  assert.ok(likeActions.includes("/item\\/"), "LikeLocker server actions must allow Garment Detail as a safe return path");
  assert.match(actions, /stay_open/);
});
