import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { COLOR_FAMILIES, GARMENT_TYPES, isAllowedGarmentAnswer } from "../lib/garment-taxonomy.ts";

const intake=readFileSync("app/closet/add/page.tsx","utf8");
const success=readFileSync("app/closet/add/FitReportSuccessModal.tsx","utf8");
const catalog=readFileSync("app/closet/add/CatalogGarmentFields.tsx","utf8");
const catalogSearch=readFileSync("app/api/catalog/search/route.ts","utf8");
const size=readFileSync("app/closet/add/GarmentSizeFields.tsx","utf8");
const form=readFileSync("app/closet/add/FitReportForm.tsx","utf8");
const actions=readFileSync("app/closet/actions.ts","utf8");
const outfits=readFileSync("app/outfits/new/page.tsx","utf8");
const domain=readFileSync("lib/domain.ts","utf8");
const taxonomyMigration=readFileSync("supabase/migrations/20260822004901_add_controlled_fit_report_taxonomy.sql","utf8");
const communityMigration=readFileSync("supabase/migrations/20260822073000_community_catalog_intake_and_seed.sql","utf8");
const pendingMigration=readFileSync("supabase/migrations/20260822162000_submission_first_catalog_foundation.sql","utf8");
const seedTransition=readFileSync("supabase/migrations/20260822162100_reclassify_starter_seed_as_candidates.sql","utf8");
const sizeKindMigration=readFileSync("supabase/migrations/20260822183000_add_not_sure_garment_size_kind.sql","utf8");
const sizeParserMigration=readFileSync("supabase/migrations/20260822183100_support_controlled_partial_sizes.sql","utf8");
const sizeDefaultMigration=readFileSync("supabase/migrations/20260822194700_add_product_size_kind_default_rpc.sql","utf8");
const fitDedupMigration=readFileSync("supabase/migrations/20260822202500_fit_report_variant_deduplication.sql","utf8");
const materialConsensusMigration=readFileSync("supabase/migrations/20260822205100_consensus_material_defaults_and_identity_flags.sql","utf8");
const distinctFitSituationsMigration=readFileSync("supabase/migrations/20260822205200_count_all_distinct_fit_situations.sql","utf8");

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

test("owner-approved intake copy and layout stay on the canonical New Fit Report",()=>{
 assert.match(intake,/Share how an item actually fits\./);
 assert.match(intake,/Tell us a little about the garment so we can make your Fit Report useful to others\./);
 assert.doesNotMatch(intake,/Back to My Closet/);
 assert.match(catalog,/Have the item with you\? Scan the barcode\. Otherwise, enter it manually and we’ll take it from there\./);
 assert.match(catalog,/Scan the barcode and we’ll check the LikeSized catalog\./);
 assert.match(catalog,/We don’t have this item yet, but no problem — you can help us add it with just a few quick questions\./);
 assert.match(intake,/Tell us more about how it fits\. You can also share styling tips, wash or dry advice, or anything else that might help someone considering this item\./);
});

test("final intake order keeps fit essentials above additional catalog evidence",()=>{
 for(const required of ["Brand / Make","Item / Model","Garment type","Color","Overall Fit Result","Condition","Fit photo","Fit notes"])assert.match(intake+catalog,new RegExp(required));
 assert.match(catalog,/Help us learn more about this item/);
 assert.match(catalog,/Every bit of information helps us build a better garment listing/);
 for(const optional of ["Retail link","UPC / barcode","Manufacturer Style / Article Number","Department","Material / Fabric Composition","Product photo"])assert.match(catalog,new RegExp(optional));
 assert.ok(intake.indexOf("Overall Fit Result") < intake.indexOf("Condition"));
 assert.ok(intake.indexOf("Condition") < intake.indexOf("Fit photo"));
 assert.ok(intake.indexOf("Fit notes") < intake.indexOf("<CatalogCommunityEnrichment"));
 assert.ok(catalog.indexOf("Department") < catalog.indexOf("Material / Fabric Composition"));
 assert.doesNotMatch(catalog,/Search retail catalog|Imported from retail catalog|catalog_source_provider|catalog_source_record/);
 assert.doesNotMatch(actions,/record_catalog_source_selection|catalog_source_provider|importedColorLabels/);
});

test("known garments only carry forward editable size-system, department, and material defaults",()=>{
 assert.match(catalogSearch,/get_product_default_size_kinds/);
 assert.match(catalogSearch,/default_size_kind/);
 assert.match(size,/product\?\.default_size_kind/);
 assert.match(size,/Preselected from prior Fit Reports\. Change it if your item uses a different size system\./);
 assert.match(catalog,/setDepartment\(knownDepartment\)/);
 assert.match(catalog,/value=\{department\}/);
 assert.match(catalog,/knownMaterials\.map/);
 assert.match(catalog,/Preselected from what LikeSized currently knows\. Change any material or percentage if your item says otherwise\./);
 assert.match(catalog,/name="upc"/);
 assert.match(catalog,/name="style_number"/);
 assert.doesNotMatch(catalog,/UPC \/ barcode <span className="muted inlineMuted">saved<\/span>/);
 assert.doesNotMatch(catalog,/Manufacturer Style \/ Article Number <span className="muted inlineMuted">saved<\/span>/);
 assert.doesNotMatch(catalog,/Already saved:/);
 assert.match(sizeDefaultMigration,/dense_rank\(\) over/);
 assert.match(sizeDefaultMigration,/vote_rank = 1/);
 assert.match(sizeDefaultMigration,/ns\.kind <> 'not_sure'/);
});

test("barcode is LikeSized-only and an unknown scan stays with the pending submission",()=>{
 assert.match(catalog,/Scan barcode/);
 assert.match(catalog,/Scan the barcode and we’ll check the LikeSized catalog/);
 assert.match(catalog,/name="scanned_barcode"/);
 assert.match(actions,/const identifier = scannedBarcode \|\| typedUpc/);
 assert.match(actions,/p_identifier_value: identifier \|\| null/);
 assert.doesNotMatch(catalog,/serpapi|google shopping/i);
});

test("reviewed Brand and Product aliases resolve back to canonical LikeSized Products",()=>{
 assert.match(catalogSearch,/from\("brand_aliases"\)/);
 assert.match(catalogSearch,/from\("product_aliases"\)/);
 assert.match(catalogSearch,/matchingProductAliasIds/);
 assert.match(catalogSearch,/detailedProducts/);
 assert.match(pendingMigration,/create table public\.product_aliases/);
 assert.match(pendingMigration,/Members read product aliases/);
 assert.doesNotMatch(catalogSearch,/serpapi|google shopping/i);
});

test("unresolved manual intake records a pending garment submission and does not create a Product",()=>{
 assert.match(actions,/product_id: null, variant_id: null/);
 assert.match(actions,/record_pending_garment_submission/);
 assert.match(pendingMigration,/create table public\.catalog_candidates/);
 assert.match(pendingMigration,/create table public\.garment_submissions/);
 assert.match(pendingMigration,/create table public\.catalog_review_flags/);
 assert.match(pendingMigration,/record_pending_garment_submission/);
 assert.match(pendingMigration,/admin_map_catalog_candidate/);
 assert.match(pendingMigration,/admin_create_product_from_candidate/);
 assert.doesNotMatch(actions,/from\("products"\)\.insert/);
 assert.doesNotMatch(actions,/from\("brands"\)\.insert/);
 assert.doesNotMatch(actions,/from\("product_families"\)\.insert/);
});

test("starter 150 remains research input instead of blindly authoritative Products",()=>{
 assert.match(seedTransition,/insert into public\.catalog_candidates/);
 assert.match(seedTransition,/'needs_enrichment'/);
 assert.match(seedTransition,/source[\s\S]*'starter_seed'/);
 assert.match(seedTransition,/not exists\(select 1 from public\.closet_items ci where ci\.product_id=p\.id\)/);
 assert.match(seedTransition,/not exists\(select 1 from public\.fit_reports fr where fr\.product_id=p\.id\)/);
});

test("size intake is controlled, complete, and keeps Other separate from Not sure",()=>{
 assert.match(size,/Choose your measurement system/);
 assert.doesNotMatch(size,/type="number"/);
 assert.match(size,/Waist/);
 assert.match(size,/Inseam/);
 assert.match(size,/Sleeve length/);
 assert.doesNotMatch(size,/Sleeve start|Sleeve end/);
 assert.match(size,/Jacket \/ chest size/);
 assert.match(size,/Band/);
 assert.match(size,/Shoe size/);
 assert.match(size,/Not sure/);
 assert.match(size,/Other size/);
 assert.match(size,/repeated sizing formats can be reviewed for future size-system additions/);
 assert.match(domain,/\{ value: "freeform", label: "Other" \}/);
 assert.match(domain,/\{ value: "not_sure", label: "Not sure" \}/);
 assert.match(sizeKindMigration,/add value if not exists 'not_sure'/);
 assert.match(sizeParserMigration,/waist_inseam:[\s\S]*coalesce\(inseam::text,'\?'\)/);
 assert.match(actions,/"freeform", "not_sure"/);
 assert.match(actions,/size_label: structuredSizeLabel/);
});

test("color, adult department, material, and percentage choices stay controlled",()=>{
 assert.equal(COLOR_FAMILIES.length,16);
 assert.match(catalog,/sort\(\(a, b\) => a\.label\.localeCompare\(b\.label\)\)/);
 assert.match(catalog,/name="color_family"/);
 assert.match(intake,/name="reported_condition"/);
 assert.match(intake,/ADULT_DEPARTMENT_KEYS/);
 assert.match(actions,/ADULT_DEPARTMENTS/);
 assert.match(catalog,/name="department"/);
 assert.match(catalog,/PERCENTAGES/);
 assert.doesNotMatch(catalog,/Percentage[\s\S]{0,180}<input type="number"/);
 assert.match(catalog,/name="materials_json"/);
 assert.match(taxonomyMigration,/color_family_key/);
 assert.match(taxonomyMigration,/reported_condition/);
 assert.match(communityMigration,/product_departments/);
 assert.match(communityMigration,/product_material_evidence/);
});

test("known Fit Reports update true duplicates but count size, objective-variant, or body-version changes",()=>{
 assert.match(actions,/FILTER_ONLY_ATTRIBUTE_KEYS/);
 assert.match(actions,/"intended_fit"/);
 assert.match(actions,/row\.option_key !== "not_sure"/);
 assert.match(actions,/save_known_fit_report/);
 assert.match(actions,/p_objective_variant_key: variantFingerprint/);
 assert.match(fitDedupMigration,/fit_reports_known_counted_identity_uq/);
 assert.match(fitDedupMigration,/user_id,product_id,normalized_size_id,fit_profile_version_id,objective_variant_key/);
 assert.match(fitDedupMigration,/garment_answers jsonb/);
 assert.match(fitDedupMigration,/revision_count integer/);
 assert.match(fitDedupMigration,/fit_report_id uuid references public\.fit_reports\(id\) on delete cascade/);
 assert.match(fitDedupMigration,/drop index if exists public\.product_attribute_evidence_member_uq/);
 assert.doesNotMatch(distinctFitSituationsMigration,/person_rank|partition by s\.user_id|partition by fr\.user_id/);
 assert.match(distinctFitSituationsMigration,/from scored s/);
});

test("material defaults use the most common exact complete composition and never average recipes",()=>{
 assert.match(materialConsensusMigration,/refresh_product_material_default/);
 assert.match(materialConsensusMigration,/string_agg/);
 assert.match(materialConsensusMigration,/dense_rank\(\) over\(order by cc\.vote_count desc\)/);
 assert.match(materialConsensusMigration,/coalesce\(v_top_ties,0\)<>1/);
 assert.match(materialConsensusMigration,/fit_report_consensus:/);
 assert.doesNotMatch(materialConsensusMigration,/avg\(percentage\)/i);
});

test("known Product garment-type disagreement saves unresolved and flags admin instead of becoming a variant",()=>{
 assert.match(catalog,/setTypeIssue\(true\)/);
 assert.match(catalog,/existing_product_id/);
 assert.match(actions,/const typeAgrees = !product\.garment_type_key \|\| product\.garment_type_key === garmentType/);
 assert.match(actions,/if \(!typeAgrees\)/);
 assert.match(actions,/product_id: null, variant_id: null/);
 assert.match(actions,/flag_known_product_garment_type_conflict/);
 assert.match(materialConsensusMigration,/flag_known_product_garment_type_conflict/);
 assert.match(materialConsensusMigration,/'ambiguous_identity'/);
 assert.match(materialConsensusMigration,/Conflicted Fit Report must remain unresolved/);
});

test("invalid submit is explicit and successful submit offers working Closet, styling, and dismiss actions",()=>{
 assert.match(form,/Fix or clear the highlighted entries below\. Everything else you entered has been kept\./);
 assert.match(form,/querySelectorAll<HTMLElement>\("input:invalid, select:invalid, textarea:invalid"\)/);
 assert.match(form,/scrollIntoView/);
 assert.match(success,/Thanks! Your Fit Report has been added\./);
 assert.match(success,/View it in My Closet/);
 assert.match(success,/Style this item/);
 assert.match(success,/Close Fit Report confirmation/);
 assert.match(success,/window\.history\.replaceState\(null, "", "\/closet\/add"\)/);
 assert.match(success,/window\.location\.assign/);
 assert.match(actions,/closet\/add\?added=/);
 assert.match(outfits,/defaultChecked=\{item\.id===preselectedClosetItemId\}/);
});

test("fixture-mode intake is interactive but cannot write preview data",()=>{
 assert.match(intake,/allowExploreFixtures/);
 assert.match(intake,/EXPLORE_FIXTURE_PRODUCTS/);
 assert.match(intake,/action=\{fixtureMode \? undefined : addGarment\}/);
 assert.match(intake,/disabled=\{fixtureMode\}/);
 assert.match(intake,/cannot save or write to Supabase/);
});