import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COLOR_FAMILIES, GARMENT_TYPES, isAllowedGarmentAnswer } from "../lib/garment-taxonomy.ts";

const intake=readFileSync("app/closet/add/page.tsx","utf8");
const catalog=readFileSync("app/closet/add/CatalogGarmentFields.tsx","utf8");
const size=readFileSync("app/closet/add/GarmentSizeFields.tsx","utf8");
const actions=readFileSync("app/closet/actions.ts","utf8");
const taxonomyMigration=readFileSync("supabase/migrations/20260822004901_add_controlled_fit_report_taxonomy.sql","utf8");
const communityMigration=readFileSync("supabase/migrations/20260822073000_community_catalog_intake_and_seed.sql","utf8");

test("every garment keeps the approved maximum-four controlled question set",()=>{
 for(const garment of GARMENT_TYPES){
  assert.ok(garment.questions.length<=4,`${garment.label} has too many questions`);
  for(const question of garment.questions)assert.ok(question.options.length>0,`${garment.label} ${question.label} needs controlled options`);
 }
 assert.match(catalog,/<option value="" disabled>Select an answer<\/option>/);
 assert.match(catalog,/<option value="not_sure">Not sure<\/option>/);
 assert.match(actions,/Every applicable item question requires a selection/);
 assert.ok(isAllowedGarmentAnswer("jeans","cut","bootcut"));
 assert.ok(!isAllowedGarmentAnswer("polo","cut","bootcut"));
});

test("final intake order keeps fit essentials above optional catalog enrichment",()=>{
 for(const required of ["Brand / Make","Item / Model","Garment type","Color","Overall Fit Result","Condition","Fit photo","Fit notes"])assert.match(intake+catalog,new RegExp(required));
 assert.match(catalog,/Want to help build the LikeSized catalog/);
 for(const optional of ["Retail link","UPC / barcode","Manufacturer Style / Article Number","Material / Fabric Composition","Product photo","Department"])assert.match(catalog,new RegExp(optional));
 assert.ok(intake.indexOf("Overall Fit Result") < intake.indexOf("Condition"));
 assert.ok(intake.indexOf("Condition") < intake.indexOf("Fit photo"));
 assert.ok(intake.indexOf("Fit notes") < intake.indexOf("CatalogCommunityEnrichment"));
 assert.doesNotMatch(catalog,/Search retail catalog|Imported from retail catalog|catalog_source_provider|catalog_source_record/);
 assert.doesNotMatch(actions,/record_catalog_source_selection|catalog_source_provider|importedColorLabels/);
});

test("barcode is LikeSized-only and survives an unknown scan into manual creation",()=>{
 assert.match(catalog,/Scan barcode/);
 assert.match(catalog,/LikeSized checks its own community catalog/);
 assert.match(catalog,/We don’t have information for this barcode yet/);
 assert.match(catalog,/name="scanned_barcode"/);
 assert.match(actions,/const identifier = scannedBarcode \|\| typedUpc/);
});

test("size requires an explicit system and is asked once",()=>{
 assert.match(size,/Choose your measurement system/);
 assert.match(size,/useState<GarmentSizeKind \| "">\(""\)/);
 assert.doesNotMatch(size,/Original label exactly as printed/);
 assert.match(actions,/size_label: structuredSizeLabel/);
});

test("color condition department and community materials stay controlled",()=>{
 assert.equal(COLOR_FAMILIES.length,16);
 assert.match(catalog,/name="color_family"/);
 assert.match(intake,/name="reported_condition"/);
 assert.match(catalog,/name="department"/);
 assert.match(catalog,/name="materials_json"/);
 assert.match(taxonomyMigration,/color_family_key/);
 assert.match(taxonomyMigration,/reported_condition/);
 assert.match(communityMigration,/product_departments/);
 assert.match(communityMigration,/product_material_evidence/);
});

test("fixture-mode intake is interactive but cannot write preview data",()=>{
 assert.match(intake,/allowExploreFixtures/);
 assert.match(intake,/EXPLORE_FIXTURE_PRODUCTS/);
 assert.match(intake,/action=\{fixtureMode \? undefined : addGarment\}/);
 assert.match(intake,/disabled=\{fixtureMode\}/);
 assert.match(intake,/cannot save or write to Supabase/);
});
