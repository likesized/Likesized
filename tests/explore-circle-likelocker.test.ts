import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const explore=readFileSync("app/explore/page.tsx","utf8");
const exploreSearch=readFileSync("components/ExploreSearch.tsx","utf8");
const exploreSearchRoute=readFileSync("app/api/explore/search/route.ts","utf8");
const exploreFilters=readFileSync("components/ExploreFilters.tsx","utf8");
const taxonomy=readFileSync("lib/garment-taxonomy.ts","utf8");
const fixtures=readFileSync("lib/explore-fixtures.ts","utf8");
const circle=readFileSync("app/circle/page.tsx","utf8");
const locker=readFileSync("app/likelocker/page.tsx","utf8");
const menu=readFileSync("components/MemberMenu.tsx","utf8");
const miniBrowser=readFileSync("components/ProductMiniBrowser.tsx","utf8");
const migration=readFileSync("supabase/migrations/20260821231040_add_likelocker_and_fit_twin_settings.sql","utf8");
const evidenceNotifications=readFileSync("supabase/migrations/20260822001113_add_product_evidence_notifications.sql","utf8");

test("Explore has grouped in-place search and strict type-aware filters",()=>{
 assert.match(exploreSearchRoute,/search_catalog_products/);
 assert.match(exploreSearchRoute,/search_outfits/);
 assert.match(exploreSearchRoute,/search_members/);
 assert.match(exploreSearch,/runSearch\(cleaned, 5, false\)/);
 assert.match(exploreSearch,/runSearch\(query, 24, true\)/);
 assert.match(exploreSearch,/\["garments", "Garments"\][\s\S]*\["outfits", "Outfits"\][\s\S]*\["people", "People"\]/);
 assert.match(exploreSearch,/ProductMiniBrowser/);
 assert.match(exploreFilters,/<label>Category/);
 assert.match(exploreFilters,/<label>Type/);
 assert.match(exploreFilters,/questionsForGarmentType/);
 assert.match(exploreFilters,/<label>Item name/);
 assert.doesNotMatch(exploreFilters,/<label>Model/);
 assert.match(exploreFilters,/Filters are strict/);
 assert.match(taxonomy,/Dresses & One-Pieces/);
 assert.match(taxonomy,/COLOR_FAMILIES/);
});

test("Explore retains fit evidence, batching, mini-browser, and preview safeguards",()=>{
 assert.match(explore,/get_product_evidence_candidates/);
 assert.match(explore,/>=75/);
 assert.match(explore,/Garments/);
 assert.match(explore,/Outfits/);
 assert.match(explore,/My Fit Matches/);
 assert.match(explore,/slice\(0,8\)/);
 assert.match(explore,/Math\.max\(24/);
 assert.match(explore,/Keep Browsing · \+24/);
 assert.match(explore,/No \{view\} found\./);
 assert.match(explore,/color_family_key/);
 assert.match(explore,/product_attribute_values/);
 assert.match(explore,/wore size/);
 assert.match(explore,/score<75/);
 assert.match(explore,/Notify me/);
 assert.match(evidenceNotifications,/notify_product_evidence_watchers_after_fit_report/);
 assert.match(miniBrowser,/← Back/);
 assert.match(miniBrowser,/aria-label="Close product browser"/);
 assert.match(miniBrowser,/iframe/);
 assert.match(fixtures,/fixture: true/);
 assert.match(fixtures,/VERCEL_ENV === "preview"/);
 assert.doesNotMatch(explore,/\bstar(?:s)?\b/i);
});

test("My Circle ranks full and regional Twin designations before ordinary following",()=>{
 assert.match(circle,/fit_twin_settings/);
 assert.match(circle,/p_match_category: "overall"/);
 assert.match(circle,/p_match_category: "tops"/);
 assert.match(circle,/p_match_category: "bottoms"/);
 assert.match(circle,/fitTwinPriority\(designationFor/);
 assert.match(circle,/full Fit Twins first/);
 assert.match(circle,/Tops Twins and Bottoms Twins/);
 assert.match(circle,/without duplicates/);
});

test("LikeLocker has one three-tab save destination",()=>{
 assert.match(locker,/>Garments</);
 assert.match(locker,/>Outfits</);
 assert.match(locker,/>Wish Locker</);
 assert.match(migration,/create table public\.product_likes/);
 assert.match(migration,/create table public\.wish_locker_items/);
 assert.match(menu,/href="\/likelocker"/);
});
