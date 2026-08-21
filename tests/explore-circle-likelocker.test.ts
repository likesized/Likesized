import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const explore=readFileSync("app/browse/page.tsx","utf8");
const circle=readFileSync("app/circle/page.tsx","utf8");
const locker=readFileSync("app/likelocker/page.tsx","utf8");
const menu=readFileSync("components/MemberMenu.tsx","utf8");
const migration=readFileSync("supabase/migrations/20260821231040_add_likelocker_and_fit_twin_settings.sql","utf8");

test("Explore uses real canonical discovery sources and 75 percent eligibility",()=>{
 assert.match(explore,/search_catalog_products/);
 assert.match(explore,/get_product_evidence_candidates/);
 assert.match(explore,/>=75/);
 assert.match(explore,/Garments/);
 assert.match(explore,/Outfits/);
 assert.match(explore,/My Fit Matches/);
 assert.doesNotMatch(explore,/\bstar(?:s)?\b/i);
});

test("My Circle starts with configurable Fit Twins then following",()=>{
 assert.match(circle,/fit_twin_settings/);
 assert.match(circle,/bTwin-aTwin/);
 assert.match(circle,/Fit Twins first/);
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
