import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COLOR_FAMILIES, GARMENT_TYPES, isAllowedGarmentAnswer } from "../lib/garment-taxonomy.ts";

const intake=readFileSync("app/closet/add/page.tsx","utf8");
const catalog=readFileSync("app/closet/add/CatalogGarmentFields.tsx","utf8");
const actions=readFileSync("app/closet/actions.ts","utf8");
const taxonomyMigration=readFileSync("supabase/migrations/20260822004901_add_controlled_fit_report_taxonomy.sql","utf8");

test("every specific garment asks no more than four optional controlled questions",()=>{
 for(const garment of GARMENT_TYPES){
  assert.ok(garment.questions.length<=4,`${garment.label} has too many questions`);
  for(const question of garment.questions)assert.ok(question.options.length>0,`${garment.label} ${question.label} needs controlled options`);
 }
 assert.match(catalog,/<option value="">Not sure<\/option>/);
 assert.match(catalog,/delete next\.neckline_height/);
 assert.ok(isAllowedGarmentAnswer("jeans","cut","bootcut"));
 assert.ok(!isAllowedGarmentAnswer("polo","cut","bootcut"));
});

test("normal intake contains only the owner-approved core fields",()=>{
 for(const required of ["Brand","Item name","Garment type","Color","Overall Fit Result","Garment condition","Fit photo","Fit notes"])assert.match(intake+catalog,new RegExp(required));
 assert.match(catalog,/Are the saved item details correct/);
 assert.match(catalog,/Yes, they’re correct/);
 assert.match(catalog,/I need to change something/);
 for(const removed of ["Market / cut segment","Same fit / cut family","Product description","Closet visibility","Would you buy it again","Times worn"])assert.doesNotMatch(intake+catalog,new RegExp(removed));
 assert.match(actions,/visibility = "shared"/);
 assert.match(actions,/isAllowedGarmentAnswer/);
});

test("color and condition are controlled and persisted separately",()=>{
 assert.equal(COLOR_FAMILIES.length,16);
 assert.match(intake,/name="color_family"/);
 assert.match(intake,/name="reported_condition"/);
 assert.match(taxonomyMigration,/color_family_key/);
 assert.match(taxonomyMigration,/reported_condition/);
});
