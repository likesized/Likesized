import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync("app/closet/add/CatalogGarmentFields.tsx", "utf8");
const actions = readFileSync("app/closet/actions.ts", "utf8");
const form = readFileSync("app/closet/add/FitReportForm.tsx", "utf8");
const fitCss = readFileSync("app/closet/add/fitReport.module.css", "utf8");
const settings = readFileSync("app/settings/page.tsx", "utf8");
const settingsCss = readFileSync("app/settings/settings.module.css", "utf8");

test("Item suggestions fire immediately after typed search text, reuse recent results, and overlay the form", () => {
  assert.match(catalog, /normalizedItem\.length < 2/);
  assert.match(catalog, /\(product && !itemIssue\)/);
  assert.match(catalog, /const ITEM_SEARCH_DEBOUNCE_MS = 0;/);
  assert.match(catalog, /itemSuggestionCache = useRef\(new Map<string, CatalogProduct>\(\)\)/);
  assert.match(catalog, /setItemSuggestions\(cached\)/);
  assert.match(catalog, /itemSuggestionCache\.current\.set\(item\.id, item\)/);
  assert.match(catalog, /showItemSuggestions/);
  assert.match(fitCss, /\.itemSuggestionDropdown\s*\{[\s\S]*?position: absolute;/);
  assert.match(fitCss, /top: calc\(100% \+ 4px\);/);
});

test("known-item Change controls invalidate matched identity instead of editing inside the old match", () => {
  assert.match(catalog, /function clearMatchedProductIdentity\(keepBrand: boolean\)/);
  assert.match(catalog, /function changeMatchedBrand\(\) \{[\s\S]*?clearMatchedProductIdentity\(false\);[\s\S]*?brandInput\.current\?\.focus\(\)/);
  assert.match(catalog, /function changeMatchedItem\(\) \{[\s\S]*?clearMatchedProductIdentity\(true\);[\s\S]*?itemNameInput\.current\?\.focus\(\)/);
  assert.match(catalog, /clearMatchedProductIdentity\(keepBrand: boolean\)[\s\S]*?setProduct\(null\);[\s\S]*?setItemName\(""\);[\s\S]*?setCategory\(""\);[\s\S]*?setType\(""\);[\s\S]*?setAnswers\(\{\}\);/);
  assert.doesNotMatch(catalog, />Change this<\/button>/);
  assert.match(fitCss, /\.changeThis\s*\{[\s\S]*?white-space: nowrap;/);
});

test("rejected barcode-resolved identity cannot silently reattach when Brand or Item no longer agrees", () => {
  assert.match(actions, /const resolvedIdentityMatchesSubmitted = !resolvedKnown \|\| Boolean\(existingProductId\) \|\| !identifier \|\| \(/);
  assert.match(actions, /normalizeSearchText\(brandName\) === resolvedKnown\.brand\.normalized_name/);
  assert.match(actions, /normalizeSearchText\(productName\) === normalizeSearchText\(resolvedKnown\.product\.name\)/);
  assert.match(actions, /const known = identityUncertain \|\| !resolvedIdentityMatchesSubmitted \? null : resolvedKnown;/);
  assert.match(catalog, /setScannedBarcode\(barcode\);/);
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

test("unmatched Fit Report details use one standard guidance message", () => {
  assert.match(catalog, /const UNMATCHED_GUIDANCE = "Enter as much information as you can about the item\. If you’re unsure about something, just leave it blank\.";/);
  assert.match(catalog, /const guidance = product[\s\S]*?: UNMATCHED_GUIDANCE;/);
  assert.doesNotMatch(catalog, /Tag photo added\. Enter the item details below/);
});

test("manual item uncertainty is prominent and returns whenever no Product is matched", () => {
  assert.match(catalog, /I’m not sure this is the correct item\/style name/);
  assert.match(catalog, /\{!product \? <label className=\{styles\.uncertaintyCheck\}>/);
  assert.doesNotMatch(catalog, /I’m not completely sure this is the correct item\/style name/);
  assert.doesNotMatch(catalog, /Enter the specific item, style, or model shown on the garment/);
  assert.match(fitCss, /\.uncertaintyCheck\s*\{[\s\S]*?padding: 12px 14px;[\s\S]*?border: 1px solid var\(--line\);/);
});

test("Fit Report opens with approved barcode and tag-photo choices plus smaller manual fallback", () => {
  const startIndex = catalog.indexOf('if (step === "start")');
  const scanIndex = catalog.indexOf('if (step === "scan")');
  const start = catalog.slice(startIndex, scanIndex);

  assert.match(start, />Identify your item</);
  assert.match(start, /Scan the barcode or add a photo of the tag so we can verify the exact item\./);
  assert.match(start, />Scan barcode<\/button>/);
  assert.match(start, />Add tag photo<\/button>/);
  assert.match(start, /Tags missing\? Enter item manually →/);
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

test("uncertain identity helper keeps the approved copy, aligns Retail Link optional, and visibly confirms Product Photo", () => {
  assert.match(catalog, /No problem — we’ll help verify it\./);
  assert.match(catalog, /Enter the best information you have and continue your Fit Report\. We’ll flag this item for review\. Please provide as much detail as possible—a retail link and clear photos of the garment or its tag\/style label are especially helpful\./);
  assert.match(catalog, /<label><b>Retail Link <span className="muted inlineMuted">optional<\/span><\/b><input/);
  assert.match(catalog, /\{!productLabelPhotoName \? <div><strong>Photo of Tag \/ Style Label<\/strong>/);
  assert.match(catalog, /<div><strong>Product Photo<\/strong><span className="fieldHelp">Upload a clear photo of the garment itself\. This helps us verify that we have the correct item\.<\/span>/);
  assert.match(catalog, /<small role="status">Photo added: \{productPhotoName\}<\/small>/);
  assert.doesNotMatch(catalog, /Anything you already attached stays with this item/);
  assert.match(catalog, /productLabelPhotoName \? styles\.identityEvidenceActionsSingle : ""/);
  assert.match(fitCss, /\.identityEvidenceActionsSingle\s*\{\s*grid-template-columns: 1fr;/);
});

test("uncertainty modal heading and spacing are locally constrained", () => {
  assert.match(fitCss, /\.identityHelpCard\s*\{[\s\S]*?padding: 24px;/);
  assert.match(fitCss, /\.identityHelpCard h2\s*\{[\s\S]*?font-size: 30px;[\s\S]*?line-height: 1\.08;/);
  assert.match(fitCss, /\.identityHelpCard > p\s*\{[\s\S]*?margin: 0 0 16px;/);
  assert.match(fitCss, /@media \(max-width: 640px\)[\s\S]*?\.identityHelpCard h2\s*\{[\s\S]*?font-size: 26px;/);
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