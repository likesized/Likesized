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
const circleFilters=readFileSync("app/circle/StyleFeedFilters.tsx","utf8");
const outfitGallery=readFileSync("app/outfits/[id]/OutfitGallery.tsx","utf8");
const commentThread=readFileSync("app/outfits/[id]/CommentThread.tsx","utf8");
const people=readFileSync("app/people/page.tsx","utf8");
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

test("Explore retains fit evidence, batching, shared mini-detail quick views, and preview safeguards",()=>{
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
 assert.match(miniBrowser,/EntityQuickView/);
 assert.match(miniBrowser,/fullLabel=\{kind==="outfit"\?"View Full Outfit":"View Garment"\}/);
 assert.doesNotMatch(miniBrowser,/iframe|product browser|← Back/);
 assert.match(fixtures,/fixture: true/);
 assert.match(fixtures,/VERCEL_ENV === "preview"/);
 assert.doesNotMatch(explore,/\bstar(?:s)?\b/i);
});

test("Style Feed is Outfit-only following inspiration with Fit Twins as the default",()=>{
 assert.match(circle,/from\("follows"\)/);
 assert.match(circle,/from\("outfit_posts"\)/);
 assert.match(circle,/\.eq\("status", "published"\)/);
 assert.match(circle,/value === "all" \? "all" : "twins"/);
 assert.match(circle,/>Fit Twins</);
 assert.match(circle,/>All Following</);
 assert.match(circle,/p_match_category: "tops"/);
 assert.match(circle,/p_match_category: "bottoms"/);
 assert.match(circle,/fitTwinLabel\(designationFor/);
 assert.match(circle,/outfit_style_tags/);
 assert.match(circle,/OUTFIT_OCCASIONS/);
 assert.match(circle,/href=\{feedHref\("all", occasion, styleTag\)\}>See All Following →<\/Link>/);
 assert.match(circle,/href="\/people">Find More Fit Twins →<\/Link>/);
 assert.doesNotMatch(circle,/get_following_feed/);
 assert.doesNotMatch(circle,/fit_report_added|closet_shared|fitTwinPriority|Overall Match/);
});

test("Style Feed reuses canonical Outfit interaction surfaces instead of page-specific previews",()=>{
 assert.match(circle,/OutfitGallery/);
 assert.match(circle,/CommentThread/);
 assert.match(circle,/triggerOnly/);
 assert.match(circle,/href=\{`\/people\/\$\{person\.username\}`\}/);
 assert.match(circle,/data-full-navigation="true"/);
 assert.match(circle,/>View Full Outfit →<\/Link>/);
 assert.doesNotMatch(circle,/className=\{styles\.photoLink\}/);
 assert.match(outfitGallery,/previewUrl\?:string/);
 assert.match(outfitGallery,/src=\{current\.previewUrl\?\?current\.url\}/);
 assert.match(outfitGallery,/src=\{current\.url\}/);
 assert.match(outfitGallery,/Math\.abs\(dx\)>=38/);
 assert.match(commentThread,/triggerOnly\?:boolean/);
 assert.match(commentThread,/!open&&triggerOnly/);
});

test("Style Feed relationship and discovery filters stay compact and do not require a giant Apply action",()=>{
 assert.match(circle,/StyleFeedFilters/);
 assert.match(circleFilters,/Search style tags/);
 assert.match(circleFilters,/router\.push/);
 assert.match(circleFilters,/OUTFIT_OCCASIONS/);
 assert.doesNotMatch(circleFilters,/>Apply</);
});

test("People My Size defaults to Twin-level discovery and keeps All Matches separate",()=>{
 assert.match(people,/value === "all" \? "all" : "twins"/);
 assert.match(people,/>Fit Twins</);
 assert.match(people,/>All Matches</);
 assert.match(people,/availableMatches\.filter\(\(person\) => Boolean\(designationFor\(person\.user_id\)\)\)/);
 assert.match(people,/\$\{twinLabel\} Match/);
});

test("LikeLocker has one three-tab save destination",()=>{
 assert.match(locker,/>Garments</);
 assert.match(locker,/>Outfits</);
 assert.match(locker,/>Wish Locker</);
 assert.match(migration,/create table public\.product_likes/);
 assert.match(migration,/create table public\.wish_locker_items/);
 assert.match(menu,/href="\/likelocker"/);
});