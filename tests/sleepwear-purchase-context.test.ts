import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GARMENT_CATEGORIES, GARMENT_TYPES } from "../lib/garment-taxonomy.ts";

const homepage = readFileSync("app/page.tsx", "utf8");
const catalog = readFileSync("app/closet/add/CatalogGarmentFields.tsx", "utf8");
const actions = readFileSync("app/closet/actions.ts", "utf8");
const styles = readFileSync("app/closet/add/fitReport.module.css", "utf8");
const purchaseMigration = readFileSync("supabase/migrations/20260823130100_purchase_context_and_sleepwear_taxonomy.sql", "utf8");

const expectedSleepwear = [
  "pajama_pants",
  "pajama_shorts",
  "pajama_set",
  "nightgown",
  "robe",
  "chemise",
  "babydoll",
  "teddy",
  "corset_bustier",
  "costume_lingerie",
];

test("Sleepwear & Lingerie is a first-class controlled intake category", () => {
  assert.ok(GARMENT_CATEGORIES.some((category) => category.value === "sleepwear_lingerie" && category.label === "Sleepwear & Lingerie"));
  const types = GARMENT_TYPES.filter((garment) => garment.category === "sleepwear_lingerie");
  assert.deepEqual(types.map((garment) => garment.key), expectedSleepwear);
  assert.ok(GARMENT_TYPES.some((garment) => garment.key === "sweatpants" && garment.category === "bottoms"));
  assert.ok(!GARMENT_TYPES.some((garment) => /sleep shirt/i.test(garment.label)));
  for (const garment of types) {
    assert.ok(garment.questions.length > 0 && garment.questions.length <= 4, `${garment.label} keeps the controlled four-question maximum`);
  }
  assert.match(catalog, /<option value="not_sure">Not sure<\/option>/);
});

test("Costume lingerie keeps the owner-locked fit-relevant four questions", () => {
  const costume = GARMENT_TYPES.find((garment) => garment.key === "costume_lingerie");
  assert.ok(costume);
  assert.deepEqual(costume.questions.map((question) => question.key), ["garment_form", "lingerie_top_style", "lingerie_bottom_style", "structure_support"]);
  const support = costume.questions.find((question) => question.key === "structure_support");
  assert.deepEqual(support?.options.map((option) => option.label), ["Soft / Stretchy", "Light Support", "Structured", "Boned"]);
  assert.ok(!costume.questions.some((question) => question.key === "closure"));
});

test("optional acquisition context stays one Fit Report observation and never Product truth", () => {
  for (const name of ["purchased_from", "price_paid", "purchase_method", "purchase_month", "purchase_year"]) assert.match(catalog, new RegExp(`name="${name}"`));
  assert.match(actions, /parsePurchaseContext/);
  assert.match(actions, /fit_report_purchase_context/);
  assert.match(actions, /onConflict: "fit_report_id"/);
  assert.match(actions, /if \(!context\.retailerText && context\.pricePaid === null && !context\.purchaseMethod && context\.purchaseMonth === null\) return/);
  assert.match(actions, /from\("retailers"\)\.select\("id"\)\.eq\("normalized_name", context\.retailerNormalized\)/);
  assert.doesNotMatch(actions, /purchased_from[\s\S]{0,600}from\("products"\)/);
  assert.match(purchaseMigration, /fit_report_id uuid primary key references public\.fit_reports\(id\) on delete cascade/);
  assert.match(purchaseMigration, /owner reads purchase context/);
  assert.match(purchaseMigration, /owner inserts purchase context/);
  assert.match(purchaseMigration, /owner updates purchase context/);
});

test("purchase controls and optional spacing remain constrained", () => {
  assert.match(catalog, /type="number" inputMode="decimal" min="0" max="999999\.99" step="0\.01"/);
  assert.match(catalog, /<option value="online">Online<\/option>/);
  assert.match(catalog, /<option value="in_store">In Store<\/option>/);
  assert.match(catalog, /<option value="gift">Received as a Gift<\/option>/);
  assert.match(catalog, /PURCHASE_MONTHS/);
  assert.match(catalog, /PURCHASE_YEARS/);
  assert.match(styles, /\.optionalDetailsBody :global\(\.privacyNote\) \{\s*margin-top: 0;/);
});

test("signed-in home is My Circle and public FAQ explains item-level evidence", () => {
  assert.match(homepage, /redirect\("\/circle"\)/);
  assert.match(homepage, /href: "\/circle"/);
  assert.doesNotMatch(homepage, /redirect\("\/outfits\?feed=following"\)/);
  assert.match(homepage, /What makes LikeSized different from other sizing and fashion tools\?/);
  assert.match(homepage, /tracks fit down to the individual item whenever real Fit Reports exist/);
  assert.match(homepage, /Two pairs of pants from the same brand can fit completely differently/);
  assert.match(homepage, /exact body measurements stay private/);
});
