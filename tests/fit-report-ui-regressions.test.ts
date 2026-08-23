import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync("app/closet/add/CatalogGarmentFields.tsx", "utf8");
const form = readFileSync("app/closet/add/FitReportForm.tsx", "utf8");
const fitCss = readFileSync("app/closet/add/fitReport.module.css", "utf8");
const settings = readFileSync("app/settings/page.tsx", "utf8");
const settingsCss = readFileSync("app/settings/settings.module.css", "utf8");

test("Item suggestions wait for typed search text and overlay the form", () => {
  assert.match(catalog, /normalizedItem\.length < 2/);
  assert.match(catalog, /\(product && !itemIssue\)/);
  assert.match(catalog, /showItemSuggestions/);
  assert.match(fitCss, /\.itemSuggestionDropdown\s*\{[\s\S]*?position: absolute;/);
  assert.match(fitCss, /top: calc\(100% \+ 4px\);/);
});

test("known-item Change controls unlock and focus editable fields on mobile", () => {
  assert.match(catalog, /window\.requestAnimationFrame\(\(\) => itemNameInput\.current\?\.focus\(\)\)/);
  assert.match(catalog, /window\.requestAnimationFrame\(\(\) => brandInput\.current\?\.focus\(\)\)/);
  assert.doesNotMatch(catalog, />Change this<\/button>/);
  assert.match(fitCss, /\.changeThis\s*\{[\s\S]*?white-space: nowrap;/);
});

test("Fit Report confirmation uses a native associated submit instead of a silent programmatic resubmit", () => {
  assert.match(form, /const FIT_REPORT_FORM_ID = "fit-report-form"/);
  assert.match(form, /type="submit"[\s\S]*?form=\{FIT_REPORT_FORM_ID\}/);
  assert.match(form, /Saving Fit Report…/);
  assert.doesNotMatch(form, /requestSubmit\(/);
});

test("Fit Notes guidance is shown once above a clean textarea", () => {
  assert.match(form, /Tell us more about how it fits\./);
  assert.doesNotMatch(form, /<textarea[^>]*placeholder=/);
});

test("confirmation grid keeps two evidence cells per row on normal mobile widths", () => {
  assert.match(fitCss, /\.reviewRows\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(fitCss, /@media \(max-width: 340px\)[\s\S]*?\.reviewRows\s*\{[\s\S]*?grid-template-columns: 1fr;/);
});

test("mobile Fit Report and Optional Additional Information keep deliberate breathing room", () => {
  assert.match(fitCss, /@media \(max-width: 640px\)[\s\S]*?\.form\s*\{\s*gap: 28px;/);
  assert.match(fitCss, /@media \(max-width: 640px\)[\s\S]*?\.optionalDetailsBody\s*\{[\s\S]*?gap: 26px;[\s\S]*?padding: 20px;/);
  assert.match(fitCss, /\.optionalDetailsBody :global\(\.fieldPair\)\s*\{\s*gap: 22px;/);
});

test("Profile Settings uses one local section spacing system instead of nested global section padding", () => {
  assert.doesNotMatch(settings, /<section className="section/);
  assert.match(settings, /styles\.settingsSection/);
  assert.match(settingsCss, /\.settingsSection\s*\{\s*padding: 32px 0;/);
  assert.match(settingsCss, /\.firstSettingsSection\s*\{\s*padding-top: 0;/);
});
