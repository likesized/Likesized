import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync("app/closet/add/CatalogGarmentFields.tsx", "utf8");
const form = readFileSync("app/closet/add/FitReportForm.tsx", "utf8");
const fitCss = readFileSync("app/closet/add/fitReport.module.css", "utf8");
const settings = readFileSync("app/settings/page.tsx", "utf8");
const settingsCss = readFileSync("app/settings/settings.module.css", "utf8");

test("Item suggestions wait for typed search text, reuse recent results, and overlay the form", () => {
  assert.match(catalog, /normalizedItem\.length < 2/);
  assert.match(catalog, /\(product && !itemIssue\)/);
  assert.match(catalog, /const ITEM_SEARCH_DEBOUNCE_MS = 100;/);
  assert.match(catalog, /itemSuggestionCache = useRef\(new Map<string, CatalogProduct>\(\)\)/);
  assert.match(catalog, /setItemSuggestions\(cached\)/);
  assert.match(catalog, /itemSuggestionCache\.current\.set\(item\.id, item\)/);
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

test("Category and garment type use one clearly shared Change control", () => {
  assert.match(catalog, /className=\{styles\.categoryTypeGroup\}/);
  assert.match(catalog, />Change category \/ type<\/button>/);
  assert.doesNotMatch(catalog, /<div className=\{styles\.editableField\}>\s*<label>Specific garment type/);
  assert.match(fitCss, /\.categoryTypeGroup\s*\{[\s\S]*?position: relative;[\s\S]*?display: grid;/);
});

test("desktop single-field controls are capped while grouped sections keep the wider form", () => {
  assert.match(fitCss, /\.form > label,[\s\S]*?\.form > :global\(\.garmentSizeFields\),[\s\S]*?\.catalogDetails > label,[\s\S]*?\.categoryTypeGroup,[\s\S]*?\.compactTagEvidence\s*\{\s*width: min\(100%, 680px\);/);
  assert.match(fitCss, /\.form\s*\{[\s\S]*?max-width: 920px;/);
  assert.doesNotMatch(fitCss, /\.optionalDetails\s*\{[\s\S]*?max-width: 680px;/);
});

test("manual item uncertainty is prominent and does not sit under redundant helper copy", () => {
  assert.match(catalog, /I’m not sure this is the correct item\/style name/);
  assert.doesNotMatch(catalog, /I’m not completely sure this is the correct item\/style name/);
  assert.doesNotMatch(catalog, /Enter the specific item, style, or model shown on the garment/);
  assert.match(fitCss, /\.uncertaintyCheck\s*\{[\s\S]*?padding: 12px 14px;[\s\S]*?border: 1px solid var\(--line\);/);
});

test("Fit Report opens with barcode and tag-photo evidence choices plus a smaller manual fallback", () => {
  const startIndex = catalog.indexOf('if (step === "start")');
  const scanIndex = catalog.indexOf('if (step === "scan")');
  const start = catalog.slice(startIndex, scanIndex);

  assert.match(start, />Identify your item</);
  assert.match(start, />Scan barcode<\/button>/);
  assert.match(start, />Take \/ upload tag photo<\/button>/);
  assert.match(start, /Cut the tags out\? Enter item manually →/);
  assert.match(start, /productLabelPhotoInput\.current\?\.click\(\)/);
  assert.match(fitCss, /\.identificationActions\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(fitCss, /\.manualFallback\s*\{[\s\S]*?background: transparent;[\s\S]*?font-size: 13px;/);
});

test("Tag-photo start uses the one canonical label evidence input and carries it into details", () => {
  assert.equal(catalog.match(/name="product_label_photo"/g)?.length, 1);
  assert.match(catalog, /type IntakeSource = "barcode" \| "tag_photo" \| "manual" \| null;/);
  assert.match(catalog, /if \(step === "start" && nextName\) \{[\s\S]*?setIntakeSource\("tag_photo"\);[\s\S]*?setStep\("details"\);/);
  assert.match(catalog, /const showCompactTagUpload = intakeSource !== "tag_photo";/);
  assert.match(catalog, /\{showCompactTagUpload \? <div className=\{styles\.compactTagEvidence\}>/);
  assert.match(fitCss, /\.compactTagEvidence\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*?padding: 10px 12px;/);
  assert.doesNotMatch(catalog, /<div className=\{styles\.photoEvidenceCard\}>\s*<strong>Product Label \/ Tag Photo/);
});

test("barcode and manual detail paths keep the compact optional tag-photo control", () => {
  assert.match(catalog, /setIntakeSource\("barcode"\)/);
  assert.match(catalog, /setIntakeSource\("manual"\)/);
  assert.match(catalog, /Product Label \/ Tag Photo <span className="muted inlineMuted">optional<\/span>/);
  assert.match(catalog, /productLabelPhotoName \? "Replace" : "Add tag photo"/);
});

test("uncertain identity helper does not ask for a second tag photo when one already exists", () => {
  assert.match(catalog, /Anything you already attached stays with this item, so we won’t ask you for the same tag photo twice\./);
  assert.match(catalog, /Retail \/ Product URL/);
  assert.match(catalog, /\{!productLabelPhotoName \? <div><strong>Photo of Tag \/ Style Label<\/strong>/);
  assert.match(catalog, /<strong>Product Photo<\/strong><span className="fieldHelp">A clear photo of the garment by itself\.<\/span>/);
  assert.match(catalog, /productLabelPhotoName \? styles\.identityEvidenceActionsSingle : ""/);
  assert.match(fitCss, /\.identityEvidenceActionsSingle\s*\{\s*grid-template-columns: 1fr;/);
});

test("Product Photo remains at the bottom of Optional Additional Information", () => {
  const enrichmentStart = catalog.indexOf("export function CatalogCommunityEnrichment");
  const garmentStart = catalog.indexOf("export function CatalogGarmentFields");
  const enrichment = catalog.slice(enrichmentStart, garmentStart);

  assert.match(enrichment, /Product Photo/);
  assert.doesNotMatch(enrichment, /Product Label \/ Tag Photo/);
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
