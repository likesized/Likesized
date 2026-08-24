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

test("manual item uncertainty is prominent and does not sit under redundant helper copy", () => {
  assert.match(catalog, /I’m not sure this is the correct item\/style name/);
  assert.doesNotMatch(catalog, /I’m not completely sure this is the correct item\/style name/);
  assert.doesNotMatch(catalog, /Enter the specific item, style, or model shown on the garment/);
  assert.match(fitCss, /\.uncertaintyCheck\s*\{[\s\S]*?padding: 12px 14px;[\s\S]*?border: 1px solid var\(--line\);/);
});

test("Fit Report confirmation uses actual form pending state instead of disabling itself on click", () => {
  assert.match(form, /useFormStatus/);
  assert.match(form, /const \{ pending \} = useFormStatus\(\)/);
  assert.match(form, /type="submit" disabled=\{pending\}/);
  assert.match(form, /pending \? "Saving Fit Report…" : "Confirm Fit Report →"/);
  assert.doesNotMatch(form, /setSubmitting/);
  assert.doesNotMatch(form, /requestSubmit\(/);
  assert.doesNotMatch(form, /form=\{FIT_REPORT_FORM_ID\}/);
});

test("Fit Notes guidance is shown once above a clean textarea", () => {
  assert.match(form, /Tell us more about how it fits\./);
  assert.doesNotMatch(form, /<textarea[^>]*placeholder=/);
});

test("confirmation grid keeps two evidence cells per row on normal mobile widths", () => {
  assert.match(fitCss, /\.reviewRows\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(fitCss, /@media \(max-width: 340px\)[\s\S]*?\.reviewRows\s*\{[\s\S]*?grid-template-columns: 1fr;/);
});

test("Fit Report spacing containers actually establish grid rhythm on desktop and mobile", () => {
  assert.match(fitCss, /\.form\s*\{[\s\S]*?max-width: 920px;[\s\S]*?gap: 30px;/);
  assert.match(fitCss, /\.catalogDetails\s*\{\s*display: grid;\s*gap: 30px;/);
  assert.match(fitCss, /\.optionalDetailsBody\s*\{\s*display: grid;\s*gap: 30px;/);
  assert.match(fitCss, /\.optionalDetailsBody :global\(\.fitDimensionFields\)\s*\{\s*display: grid;\s*gap: 22px;/);
  assert.match(fitCss, /@media \(max-width: 640px\)[\s\S]*?\.catalogDetails\s*\{\s*gap: 34px;/);
  assert.match(fitCss, /@media \(max-width: 640px\)[\s\S]*?\.optionalDetailsBody\s*\{[\s\S]*?gap: 30px;/);
});

test("Profile Settings uses one local section spacing system instead of nested global section padding", () => {
  assert.doesNotMatch(settings, /<section className="section/);
  assert.match(settings, /styles\.settingsSection/);
  assert.match(settingsCss, /\.settingsSection\s*\{\s*padding: 32px 0;/);
  assert.match(settingsCss, /\.firstSettingsSection\s*\{\s*padding-top: 0;/);
});

test("Fit Community setting uses the approved member-facing language", () => {
  assert.match(settings, /<strong>Your Fit Community<\/strong>/);
  assert.match(settings, /Choose who LikeSized should prioritize in People My Size, Fit Twin suggestions, and your social feed\./);
  assert.match(settings, /This does not affect your Body Match percentage or what clothing you can post\./);
  assert.doesNotMatch(settings, /<strong>Choose Men, Women, or Both<\/strong>/);
});
