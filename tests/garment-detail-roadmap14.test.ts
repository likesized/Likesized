import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/item/[slug]/page.tsx", "utf8");
const fituition = readFileSync("app/item/[slug]/FituitionSections.tsx", "utf8");
const actions = readFileSync("app/item/[slug]/ItemActionsClient.tsx", "utf8");
const expanded = readFileSync("app/item/[slug]/ExpandedEvidenceClient.tsx", "utf8");
const evidenceRoute = readFileSync("app/api/items/[slug]/evidence/route.ts", "utf8");
const watchRoute = readFileSync("app/api/items/[slug]/evidence-watch/route.ts", "utf8");
const outfitWatchRoute = readFileSync("app/api/outfits/[id]/tagged-fit/watch/route.ts", "utf8");
const watchService = readFileSync("lib/product-evidence-watch.ts", "utf8");
const inspiration = readFileSync("app/item/[slug]/StyleInspiration.tsx", "utf8");
const likeActions = readFileSync("app/likelocker/actions.ts", "utf8");
const recommendation = readFileSync("lib/recommendation.ts", "utf8");

test("Roadmap 14 keeps variation identity internal instead of exposing a Garment Detail filter", () => {
  assert.match(page, /requestedVariation=first\(query\.variation\)/);
  assert.match(page, /tracked_variation_key/);
  assert.ok(!page.includes("Style / Cut"));
  assert.ok(!page.includes("variationPicker"));
  assert.ok(!page.includes("trackedVariationShortLabel"));
  assert.ok(!fituition.includes("BEST EXACT VARIATION"));
  assert.ok(!fituition.includes("CLOSEST RELATED VARIATION"));
  assert.ok(!fituition.includes("tracked variation"));
  assert.ok(!page.includes("product_variants"), "Garment Detail must not treat size/color/SKU rows as fit identity");
});

test("Roadmap 14 uses the shared canonical Product image resolver", () => {
  assert.match(page, /resolveCanonicalProductImages/);
  assert.match(page, /canonicalProductImageKey/);
  assert.match(page, /variationKey:selectedVariationKey/);
  assert.ok(!page.includes("product.image_url||"), "Garment Detail must not invent its own image fallback order");
});

test("Roadmap 14 renders the owner-approved FITuition hierarchy without changing the recommendation engine", () => {
  assert.match(fituition, /FITuition recommends: Size/);
  assert.match(fituition, /Confidence:/);
  assert.match(fituition, /Aggregate Fit Report evidence/);
  assert.match(fituition, /YOUR CLOSEST MATCH/);
  assert.match(fituition, /Not enough evidence yet to confidently recommend a size\./);
  assert.match(fituition, /BEST AVAILABLE MATCH/);
  assert.match(fituition, /GarmentNotifyButton/);
  assert.match(fituition, /STRONG_FIT_REPORT_MATCH_THRESHOLD/);
  assert.match(fituition, /recommendSize\(\[\.\.\.communityEvidence,\.\.\.closetEvidence\]\)/);
  assert.match(fituition, /closetEvidenceRelevance/);
  assert.match(recommendation, /export function recommendSize/);
  assert.ok(!fituition.includes("function recommendSize"));
  assert.ok(!fituition.includes("YOUR CLOSET HISTORY"), "Closet history may inform FITuition but must not become an extra Garment Detail section");
});

test("individual Body Match evidence includes clickable canonical usernames", () => {
  assert.match(fituition, /href=\{`\/people\/\$\{encodeURIComponent\(username\)\}`\}/);
  assert.match(fituition, />@\{username\}<\/Link>/);
  assert.match(expanded, /href=\{`\/people\/\$\{encodeURIComponent\(row\.username\)\}`\}/);
  assert.match(evidenceRoute, /username:profileById\.get\(row\.user_id\)\?\.username/);
});

test("expanded evidence stays lazy, bounded, and free of public tracked-variation detail", () => {
  assert.match(fituition, /<ExpandedEvidenceClient/);
  assert.match(expanded, /fetch\(`\/api\/items\/\$\{encodeURIComponent\(slug\)\}\/evidence/);
  assert.match(evidenceRoute, /p_result_limit:200/);
  assert.match(evidenceRoute, /Promise\.all/);
  assert.ok(!expanded.includes("variationDetail"));
  assert.ok(!evidenceRoute.includes("trackedVariationDetail"));
  assert.match(page, /<Suspense fallback=\{<FituitionEvidenceFallback\/>\}>/);
  assert.match(page, /<FituitionEvidenceSections/);
});

test("Garment Detail Notify reuses the canonical product evidence watch service", () => {
  assert.match(watchService, /product_evidence_notifications/);
  assert.match(watchService, /QUICK_VIEW_STRONG_MATCH_THRESHOLD/);
  assert.match(watchRoute, /readProductEvidenceWatch/);
  assert.match(watchRoute, /enableProductEvidenceWatch/);
  assert.match(outfitWatchRoute, /readProductEvidenceWatch/);
  assert.match(outfitWatchRoute, /enableProductEvidenceWatch/);
  assert.ok(!watchRoute.includes('.from("product_evidence_notifications")'));
  assert.ok(!outfitWatchRoute.includes('.from("product_evidence_notifications")'));
});

test("Style Inspiration is bounded, fresh, and only offers Explore when more than three Outfits exist", () => {
  assert.match(inspiration, /LOOKBACK_DAYS=90/);
  assert.match(inspiration, /DISPLAY_COUNT=3/);
  assert.match(inspiration, /hasMore=ranked\.length>DISPLAY_COUNT/);
  assert.match(inspiration, /displayed=ranked\.slice\(0,DISPLAY_COUNT\)/);
  assert.match(inspiration, /See how people are styling this garment\./);
  assert.match(inspiration, /hasMore\?<Link/);
  assert.match(inspiration, /\/explore\?product=/);
  assert.ok(!inspiration.includes("&variation="), "Style Inspiration must not expose internal variation filtering in Explore");
});

test("Garment Detail utility actions keep canonical LikeLocker, Wish Locker, Shop, Share and Report behavior", () => {
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
