"use server";

import { createHash, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { COLOR_FAMILIES, GARMENT_TYPE_BY_KEY, isAllowedGarmentAnswer, questionsForGarmentType } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";
import type { GarmentMarketSegment, GarmentSizeKind } from "@/lib/domain";
import type { FitPhotoQualityMetrics } from "@/lib/fit-photo-quality";

const FIT_RESULTS = new Set(["too_small", "snug", "just_right", "relaxed", "too_big"]);
const REPORTED_CONDITIONS = new Set(["new", "used", "altered"]);
const PURCHASE_METHODS = new Set(["online", "in_store", "gift"]);
const COLOR_FAMILY_KEYS = new Set(COLOR_FAMILIES.map((item) => item.value));
const SIZE_KINDS = new Set(["alpha", "numeric", "waist_inseam", "dress_shirt", "jacket", "bra", "shoe", "length_designation", "freeform", "not_sure"]);
const ADULT_DEPARTMENTS = new Set(["womens", "mens", "unisex"]);
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const TRACKING_PARAMS = new Set(["fbclid", "gclid", "dclid", "mc_cid", "mc_eid", "msclkid"]);
const PRODUCT_ATTRIBUTE_PREFIX = "product_attribute__";
const FILTER_ONLY_ATTRIBUTE_KEYS = new Set(["intended_fit"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type BrandRecord = { id: string; name: string; slug: string; normalized_name: string };
type ProductRecord = { id: string; name: string; slug: string; category: string; garment_type_key: string | null; market_segment: GarmentMarketSegment; product_family_id?: string | null; brand_id?: string; manufacturer_style_number?: string | null; manufacturer_style_normalized?: string | null };
type ParsedSize = Record<string, string | number | null> & { kind: GarmentSizeKind; normalized_key: string; display_label: string };
type MaterialClaim = { material_key: string; percentage: number | null };
type AttributeRow = { attribute_key: string; option_key: string };
type KnownFitSaveRow = { fit_report_id: string; closet_item_id: string; created: boolean };
type FitPhotoRole = "front" | "back";
type PurchaseContext = {
  retailerText: string | null;
  retailerNormalized: string | null;
  pricePaid: number | null;
  purchaseMethod: "online" | "in_store" | "gift" | null;
  purchaseMonth: number | null;
  purchaseYear: number | null;
};

function fail(code: string): never { redirect(`/closet/add?error=${encodeURIComponent(code)}`); }
function text(formData: FormData, name: string) { return String(formData.get(name) ?? "").trim(); }
function file(formData: FormData, name: string) { const entry = formData.get(name); return entry instanceof File && entry.size > 0 ? entry : null; }
function normalizeSearchText(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function normalizeIdentifier(value: string) { return value.trim().toUpperCase().replace(/[\s_.-]+/g, ""); }
function normalizeProductUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid URL");
  url.protocol = "https:";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}
function parseMaterials(raw: string): MaterialClaim[] {
  if (!raw) return [];
  if (raw.length > 5000) throw new Error("Invalid materials");
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value) || value.length > 12) throw new Error("Invalid materials");
  const rows: MaterialClaim[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid materials");
    const record = item as Record<string, unknown>;
    const materialKey = typeof record.material_key === "string" ? record.material_key.trim() : "";
    const percentageRaw = record.percentage;
    const percentage = percentageRaw === null || percentageRaw === "" || percentageRaw === undefined ? null : Number(percentageRaw);
    if (!materialKey || materialKey.length > 80 || (percentage !== null && (!Number.isInteger(percentage) || percentage < 1 || percentage > 100))) throw new Error("Invalid materials");
    rows.push({ material_key: materialKey, percentage });
  }
  if (new Set(rows.map((row) => row.material_key)).size !== rows.length) throw new Error("Duplicate materials");
  return rows;
}
function parsePurchaseContext(formData: FormData): PurchaseContext {
  const retailerText = text(formData, "purchased_from") || null;
  const rawPrice = text(formData, "price_paid");
  const rawMethod = text(formData, "purchase_method");
  const rawMonth = text(formData, "purchase_month");
  const rawYear = text(formData, "purchase_year");
  if (retailerText && retailerText.length > 160) throw new Error("Invalid retailer");
  let pricePaid: number | null = null;
  if (rawPrice) {
    if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(rawPrice)) throw new Error("Invalid price");
    pricePaid = Number(rawPrice);
    if (!Number.isFinite(pricePaid) || pricePaid < 0 || pricePaid > 999999.99) throw new Error("Invalid price");
  }
  const purchaseMethod = rawMethod ? rawMethod as PurchaseContext["purchaseMethod"] : null;
  if (purchaseMethod && !PURCHASE_METHODS.has(purchaseMethod)) throw new Error("Invalid purchase method");
  if (Boolean(rawMonth) !== Boolean(rawYear)) throw new Error("Incomplete purchase date");
  let purchaseMonth: number | null = null;
  let purchaseYear: number | null = null;
  if (rawMonth && rawYear) {
    purchaseMonth = Number(rawMonth);
    purchaseYear = Number(rawYear);
    const now = new Date();
    if (!Number.isInteger(purchaseMonth) || purchaseMonth < 1 || purchaseMonth > 12 || !Number.isInteger(purchaseYear) || purchaseYear < 1900 || purchaseYear > now.getFullYear()) throw new Error("Invalid purchase date");
    if (purchaseYear === now.getFullYear() && purchaseMonth > now.getMonth() + 1) throw new Error("Future purchase date");
  }
  return {
    retailerText,
    retailerNormalized: retailerText ? normalizeSearchText(retailerText) || null : null,
    pricePaid,
    purchaseMethod,
    purchaseMonth,
    purchaseYear,
  };
}
function parseFitPhotoQuality(formData: FormData, name: "photo_front_quality" | "photo_back_quality"): FitPhotoQualityMetrics | null {
  const raw = text(formData, name);
  if (!raw) return null;
  if (raw.length > 1000) throw new Error("Invalid Fit Photo quality payload");
  const value = JSON.parse(raw) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid Fit Photo quality payload");
  const record = value as Record<string, unknown>;
  const scoreKeys = ["garment_visibility_score", "sharpness_score", "resolution_score", "framing_score", "exposure_score"] as const;
  for (const key of scoreKeys) {
    const score = Number(record[key]);
    if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("Invalid Fit Photo quality score");
  }
  const imageWidth = Number(record.image_width);
  const imageHeight = Number(record.image_height);
  const perceptualHash = typeof record.perceptual_hash === "string" ? record.perceptual_hash : "";
  if (!Number.isInteger(imageWidth) || !Number.isInteger(imageHeight) || imageWidth < 1 || imageHeight < 1 || imageWidth > 30000 || imageHeight > 30000 || !/^[01]{64}$/.test(perceptualHash) || record.quality_source !== "automatic") throw new Error("Invalid Fit Photo quality dimensions");
  return {
    garment_visibility_score: Number(record.garment_visibility_score),
    sharpness_score: Number(record.sharpness_score),
    resolution_score: Number(record.resolution_score),
    framing_score: Number(record.framing_score),
    exposure_score: Number(record.exposure_score),
    image_width: imageWidth,
    image_height: imageHeight,
    perceptual_hash: perceptualHash,
    quality_source: "automatic",
  };
}
function garmentAnswerSnapshot(entries: AttributeRow[]) {
  return Object.fromEntries(entries.map((row) => [row.attribute_key, row.option_key]));
}
function objectiveVariantKey(garmentType: string, entries: AttributeRow[]) {
  const objective = entries
    .filter((row) => !FILTER_ONLY_ATTRIBUTE_KEYS.has(row.attribute_key) && row.option_key !== "not_sure")
    .sort((a, b) => a.attribute_key.localeCompare(b.attribute_key))
    .map((row) => [row.attribute_key, row.option_key]);
  return createHash("sha256").update(JSON.stringify({ garment_type: garmentType, objective })).digest("hex");
}

async function getGarmentType(supabase: SupabaseClient, key: string) {
  const { data, error } = await supabase.from("garment_types").select("key,category").eq("key", key).eq("intake_active", true).maybeSingle();
  if (error || !data) throw error ?? new Error("Unknown garment type");
  return data as { key: string; category: string };
}

async function getCatalogProductById(supabase: SupabaseClient, id: string) {
  const { data: product, error } = await supabase.from("products").select("id,name,slug,category,garment_type_key,market_segment,product_family_id,brand_id,manufacturer_style_number,manufacturer_style_normalized").eq("id", id).neq("catalog_status", "rejected").maybeSingle();
  if (error || !product) throw error ?? new Error("Unknown catalog product");
  const { data: brand, error: brandError } = await supabase.from("brands").select("id,name,slug,normalized_name").eq("id", product.brand_id).maybeSingle();
  if (brandError || !brand) throw brandError ?? new Error("Unknown product brand");
  return { brand: brand as BrandRecord, product: product as ProductRecord };
}

async function resolveKnownCatalogProduct(supabase: SupabaseClient, existingProductId: string | null, brandName: string, styleNumber: string | null, identifier: string, productUrl: string) {
  if (existingProductId) return getCatalogProductById(supabase, existingProductId);
  const normalizedUrl = productUrl ? normalizeProductUrl(productUrl) : null;
  const { data: resolvedId, error } = await supabase.rpc("resolve_catalog_product", { p_existing_product_id: null, p_brand_name: brandName, p_style_number: styleNumber, p_identifier: identifier || null, p_normalized_url: normalizedUrl });
  if (error) throw error;
  return resolvedId ? getCatalogProductById(supabase, String(resolvedId)) : null;
}

async function getNormalizedSize(supabase: SupabaseClient, structuredLabel: string, kind: GarmentSizeKind, sizingSystem: string | null) {
  const { data: parsedData, error: parseError } = await supabase.rpc("parse_garment_size", { p_label: structuredLabel, p_kind: kind, p_system: sizingSystem });
  if (parseError || !parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) throw parseError ?? new Error("Could not parse size");
  const parsed = parsedData as ParsedSize;
  const { data: existing, error } = await supabase.from("normalized_sizes").select("id").eq("normalized_key", parsed.normalized_key).maybeSingle();
  if (error) throw error;
  if (existing) return existing.id as string;
  const allowed = ["kind", "normalized_key", "display_label", "sizing_system", "alpha_size", "numeric_size", "waist_size", "inseam_size", "length_designation", "collar_size", "sleeve_min", "sleeve_max", "jacket_chest_size", "bra_band", "bra_cup", "shoe_size", "freeform_normalized"];
  const row = Object.fromEntries(allowed.filter((key) => parsed[key] !== undefined).map((key) => [key, parsed[key]]));
  const { data, error: insertError } = await supabase.from("normalized_sizes").insert(row).select("id").single();
  if (!insertError) return data.id as string;
  if (insertError.code === "23505") { const { data: raced } = await supabase.from("normalized_sizes").select("id").eq("normalized_key", parsed.normalized_key).single(); return raced!.id as string; }
  throw insertError;
}

async function getOrCreateVariant(supabase: SupabaseClient, productId: string, normalizedSizeId: string, sizeLabel: string, colorFamily: string, marketSegment: GarmentMarketSegment) {
  const colorLabel = COLOR_FAMILIES.find((item) => item.value === colorFamily)?.label ?? colorFamily;
  const colorNormalized = normalizeSearchText(colorLabel);
  const { data: existing, error } = await supabase.from("product_variants").select("id").eq("product_id", productId).eq("normalized_size_id", normalizedSizeId).eq("color_family_key", colorFamily).maybeSingle();
  if (error) throw error;
  if (existing) return existing.id as string;
  const { data, error: insertError } = await supabase.from("product_variants").insert({ product_id: productId, normalized_size_id: normalizedSizeId, size_label: sizeLabel, color_label: colorLabel, color_normalized: colorNormalized, color_family_key: colorFamily, market_segment: marketSegment }).select("id").single();
  if (!insertError) return data.id as string;
  if (insertError.code === "23505") { const { data: raced } = await supabase.from("product_variants").select("id").eq("product_id", productId).eq("normalized_size_id", normalizedSizeId).eq("color_family_key", colorFamily).single(); return raced!.id as string; }
  throw insertError;
}

async function flagPossibleDuplicate(supabase: SupabaseClient, productIds: string[]) {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length < 2) return;
  const { error } = await supabase.rpc("flag_catalog_possible_duplicate", { p_product_ids: ids, p_reason: "Conflicting member identifier or retailer evidence" });
  if (error) throw error;
}

async function recordIdentifier(supabase: SupabaseClient, productId: string, variantId: string, original: string, kind: "manufacturer_style") {
  if (!original) return;
  const normalized = normalizeIdentifier(original);
  const { data: existing, error: lookupError } = await supabase.from("product_identifiers").select("id,product_id").eq("identifier_type", kind).eq("normalized_value", normalized).is("retailer_id", null).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) { if (existing.product_id && existing.product_id !== productId) await flagPossibleDuplicate(supabase, [existing.product_id, productId]); return; }
  const { error } = await supabase.from("product_identifiers").insert({ product_id: productId, variant_id: variantId, identifier_type: kind, original_value: original, normalized_value: normalized });
  if (error && error.code !== "23505") throw error;
}

async function recordListing(supabase: SupabaseClient, productId: string, variantId: string, rawUrl: string) {
  if (!rawUrl) return;
  const normalizedUrl = normalizeProductUrl(rawUrl);
  const domain = new URL(normalizedUrl).hostname;
  let { data: retailer } = await supabase.from("retailers").select("id").eq("domain", domain).maybeSingle();
  if (!retailer) {
    const { data, error } = await supabase.from("retailers").insert({ name: domain, normalized_name: normalizeSearchText(domain), domain }).select("id").single();
    if (!error) retailer = data;
    else if (error.code === "23505") { const { data: raced } = await supabase.from("retailers").select("id").eq("domain", domain).single(); retailer = raced; }
    else throw error;
  }
  const { data: existing, error: lookupError } = await supabase.from("retailer_listings").select("id,product_id").eq("normalized_url", normalizedUrl).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) { if (existing.product_id !== productId) await flagPossibleDuplicate(supabase, [existing.product_id, productId]); return; }
  const { error } = await supabase.from("retailer_listings").insert({ product_id: productId, variant_id: variantId, retailer_id: retailer?.id ?? null, product_url: rawUrl, normalized_url: normalizedUrl });
  if (error && error.code !== "23505") throw error;
}

async function savePurchaseContext(supabase: SupabaseClient, userId: string, fitReportId: string, context: PurchaseContext) {
  if (!context.retailerText && context.pricePaid === null && !context.purchaseMethod && context.purchaseMonth === null) return;
  let retailerId: string | null = null;
  if (context.retailerNormalized) {
    const { data, error } = await supabase.from("retailers").select("id").eq("normalized_name", context.retailerNormalized).maybeSingle();
    if (error) throw error;
    retailerId = data?.id ?? null;
  }
  const { error } = await supabase.from("fit_report_purchase_context").upsert({
    fit_report_id: fitReportId,
    user_id: userId,
    retailer_text: context.retailerText,
    retailer_normalized: context.retailerNormalized,
    retailer_id: retailerId,
    price_paid: context.pricePaid,
    purchase_method: context.purchaseMethod,
    purchase_month: context.purchaseMonth,
    purchase_year: context.purchaseYear,
    updated_at: new Date().toISOString(),
  }, { onConflict: "fit_report_id" });
  if (error) throw error;
}

async function saveFitPhoto(supabase: SupabaseClient, userId: string, closetItemId: string, photo: File, role: FitPhotoRole, quality: FitPhotoQualityMetrics | null) {
  const extension = PHOTO_TYPES[photo.type];
  const storagePath = `${userId}/${closetItemId}/${role}-${randomUUID()}.${extension}`;
  const { data: existing, error: lookupError } = await supabase.from("fit_reference_photos").select("id,storage_path").eq("closet_item_id", closetItemId).eq("user_id", userId).eq("photo_role", role).maybeSingle();
  if (lookupError) throw lookupError;
  const { error: uploadError } = await supabase.storage.from("fit-reference-photos").upload(storagePath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
  if (uploadError) throw uploadError;
  const qualityRow = quality ? {
    garment_visibility_score: quality.garment_visibility_score,
    sharpness_score: quality.sharpness_score,
    resolution_score: quality.resolution_score,
    framing_score: quality.framing_score,
    exposure_score: quality.exposure_score,
    image_width: quality.image_width,
    image_height: quality.image_height,
    quality_source: quality.quality_source,
    quality_scored_at: new Date().toISOString(),
  } : {};
  let photoId = existing?.id ?? null;
  if (existing) {
    const { error: updateError } = await supabase.from("fit_reference_photos").update({ storage_path: storagePath, ...qualityRow }).eq("id", existing.id).eq("user_id", userId);
    if (updateError) { await supabase.storage.from("fit-reference-photos").remove([storagePath]); throw updateError; }
  } else {
    const { data: inserted, error: metadataError } = await supabase.from("fit_reference_photos").insert({ user_id: userId, closet_item_id: closetItemId, storage_path: storagePath, photo_role: role, ...qualityRow }).select("id").single();
    if (metadataError || !inserted) { await supabase.storage.from("fit-reference-photos").remove([storagePath]); throw metadataError ?? new Error("Could not save Fit Photo metadata"); }
    photoId = inserted.id as string;
  }
  if (photoId && quality?.perceptual_hash) {
    const { error: fingerprintError } = await supabase.rpc("record_fit_photo_perceptual_fingerprint", {
      p_photo_id: photoId,
      p_perceptual_hash: quality.perceptual_hash,
    });
    if (fingerprintError) throw fingerprintError;
  }
  if (existing) await supabase.storage.from("fit-reference-photos").remove([existing.storage_path]);
  return storagePath;
}

async function uploadPrivateCatalogPhoto(supabase: SupabaseClient, userId: string, closetItemId: string, photo: File, kind: "product" | "label") {
  const extension = PHOTO_TYPES[photo.type];
  const storagePath = `${userId}/pending/${closetItemId}/${kind}-${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("catalog-submission-photos").upload(storagePath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
  if (error) throw error;
  return storagePath;
}

async function saveKnownProductLabelPhoto(supabase: SupabaseClient, userId: string, productId: string, fitReportId: string, photo: File) {
  const extension = PHOTO_TYPES[photo.type];
  const storagePath = `${userId}/labels/${productId}/${fitReportId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("catalog-submission-photos").upload(storagePath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
  if (uploadError) throw uploadError;
  const { data, error: metadataError } = await supabase.from("product_label_photo_evidence").insert({ product_id: productId, fit_report_id: fitReportId, storage_path: storagePath, submitted_by: userId }).select("id").single();
  if (metadataError) { await supabase.storage.from("catalog-submission-photos").remove([storagePath]); throw metadataError; }
  return { path: storagePath, evidenceId: data.id as string };
}

async function validatedProductAttributes(supabase: SupabaseClient, formData: FormData, garmentType: string) {
  const entries: AttributeRow[] = [...formData.entries()]
    .filter(([name, value]) => name.startsWith(PRODUCT_ATTRIBUTE_PREFIX) && typeof value === "string")
    .map(([name, value]) => ({ attribute_key: name.slice(PRODUCT_ATTRIBUTE_PREFIX.length), option_key: String(value).trim() }));
  if (new Set(entries.map((row) => row.attribute_key)).size !== entries.length) throw new Error("Duplicate product attributes");
  const allQuestions = questionsForGarmentType(garmentType);
  const allKeys = new Set(allQuestions.map((item) => item.key));
  if (entries.some((row) => !allKeys.has(row.attribute_key))) throw new Error("Invalid product attribute");
  const selected = Object.fromEntries(entries.map((row) => [row.attribute_key, row.option_key]));
  const applicable = allQuestions.filter((item) => item.key !== "neckline_height" || (selected.top_sleeve !== "strapless" && selected.swim_top !== "strapless"));
  if (applicable.some((item) => !selected[item.key])) throw new Error("Every applicable item question requires a selection");
  const claims = entries.filter((row) => row.option_key !== "not_sure");
  if (claims.some((row) => !row.option_key || row.option_key.length > 80 || !isAllowedGarmentAnswer(garmentType, row.attribute_key, row.option_key))) throw new Error("Invalid product attribute option");
  if (claims.length) {
    const keys = claims.map((row) => row.attribute_key);
    const { data: definitions, error: definitionError } = await supabase.from("garment_attribute_definitions").select("key").in("key", keys);
    if (definitionError) throw definitionError;
    if (new Set((definitions ?? []).map((row) => row.key)).size !== new Set(keys).size) throw new Error("Unknown product attribute");
    const { data: options, error: optionError } = await supabase.from("garment_attribute_options").select("attribute_key,option_key").in("attribute_key", keys);
    if (optionError) throw optionError;
    const allowed = new Set((options ?? []).map((row) => `${row.attribute_key}:${row.option_key}`));
    if (claims.some((row) => !allowed.has(`${row.attribute_key}:${row.option_key}`))) throw new Error("Invalid product attribute option");
  }
  return { entries, claims };
}

export async function addGarment(formData: FormData) {
  const brandName = text(formData, "brand");
  const productName = text(formData, "product");
  const existingProductId = text(formData, "existing_product_id") || null;
  const identityUncertain = !existingProductId && text(formData, "item_identity_uncertain") === "1";
  const garmentType = text(formData, "garment_type");
  const sizeKind = text(formData, "size_kind") as GarmentSizeKind;
  const structuredSizeLabel = text(formData, "size_normalized_label");
  const sizingSystem = text(formData, "sizing_system") || null;
  const styleNumber = text(formData, "style_number") || null;
  const styleIssue = text(formData, "identity_issue_style") || null;
  const barcodeIssue = text(formData, "identity_issue_barcode") || null;
  const scannedBarcode = text(formData, "scanned_barcode");
  const typedUpc = text(formData, "upc");
  const identifier = scannedBarcode || typedUpc;
  const productUrl = text(formData, "product_url");
  const departmentRaw = text(formData, "department");
  const department = departmentRaw && departmentRaw !== "not_sure" ? departmentRaw : null;
  const colorFamily = text(formData, "color_family");
  const fit = text(formData, "fit");
  const reportedCondition = text(formData, "reported_condition");
  const garmentCondition = reportedCondition === "altered" ? "altered" : "normal";
  const fitNotes = text(formData, "fit_notes") || null;
  let materialClaims: MaterialClaim[] = [];
  let purchaseContext: PurchaseContext;
  let frontPhotoQuality: FitPhotoQualityMetrics | null = null;
  let backPhotoQuality: FitPhotoQualityMetrics | null = null;
  try {
    materialClaims = parseMaterials(text(formData, "materials_json"));
    purchaseContext = parsePurchaseContext(formData);
    frontPhotoQuality = parseFitPhotoQuality(formData, "photo_front_quality");
    backPhotoQuality = parseFitPhotoQuality(formData, "photo_back_quality");
  } catch { fail("invalid_fields"); }

  if (!brandName || brandName.length > 120 || !productName || productName.length > 180 || (existingProductId && !UUID.test(existingProductId)) || !GARMENT_TYPE_BY_KEY.has(garmentType) || !SIZE_KINDS.has(sizeKind) || !structuredSizeLabel || structuredSizeLabel.length > 60 || (sizingSystem && sizingSystem.length > 20) || !COLOR_FAMILY_KEYS.has(colorFamily) || !FIT_RESULTS.has(fit) || !REPORTED_CONDITIONS.has(reportedCondition) || (fitNotes && fitNotes.length > 2000) || (productUrl && productUrl.length > 1000) || identifier.length > 120 || (styleNumber && styleNumber.length > 100) || (styleIssue && styleIssue.length > 180) || (barcodeIssue && barcodeIssue.length > 120)) fail("invalid_fields");
  if ((identifier && !/^\d{6,32}$/.test(identifier.replace(/\D/g, ""))) || (barcodeIssue && !/^\d{6,32}$/.test(barcodeIssue.replace(/\D/g, "")))) fail("invalid_fields");
  if (department && !ADULT_DEPARTMENTS.has(department)) fail("invalid_fields");
  let normalizedProductUrl: string | null = null;
  if (productUrl) { try { normalizedProductUrl = normalizeProductUrl(productUrl); } catch { fail("invalid_fields"); } }

  const photoFront = file(formData, "photo_front");
  const photoBack = file(formData, "photo_back");
  const productPhoto = file(formData, "product_photo");
  const productLabelPhoto = file(formData, "product_label_photo");
  for (const candidate of [photoFront, photoBack, productPhoto, productLabelPhoto]) if (candidate && (!PHOTO_TYPES[candidate.type] || candidate.size > 8 * 1024 * 1024)) fail("invalid_photo");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/closet/add");

  const [{ data: profile }, { data: fitProfile }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile?.username || !fitProfile?.completed_at) redirect("/onboarding");

  const submittedType = await getGarmentType(supabase, garmentType).catch(() => null);
  if (!submittedType) fail("invalid_fields");
  let attributeEntries: AttributeRow[] = [];
  let attributeClaims: AttributeRow[] = [];
  try {
    const validated = await validatedProductAttributes(supabase, formData, garmentType);
    attributeEntries = validated.entries;
    attributeClaims = validated.claims;
  } catch { fail("invalid_fields"); }
  const answerSnapshot = garmentAnswerSnapshot(attributeEntries);
  const variantFingerprint = objectiveVariantKey(garmentType, attributeEntries);

  if (department) {
    const { data: knownDepartment, error: departmentError } = await supabase.from("product_departments").select("key").eq("key", department).maybeSingle();
    if (departmentError || !knownDepartment) fail("invalid_fields");
  }
  if (materialClaims.length) {
    const { data: knownMaterials, error: materialError } = await supabase.from("materials").select("key").in("key", materialClaims.map((item) => item.material_key));
    if (materialError || new Set((knownMaterials ?? []).map((item) => item.key)).size !== materialClaims.length) fail("invalid_fields");
  }

  const { data: fitProfileVersionId, error: versionError } = await supabase.rpc("commit_fit_profile_version");
  if (versionError || !fitProfileVersionId) fail("save_failed");

  const newClosetItemId = randomUUID();
  let savedClosetItemId: string = newClosetItemId;
  let updatedExisting = false;
  const fitPhotoPaths: string[] = [];
  const catalogPhotoPaths: string[] = [];
  let publicProductPhotoPath: string | null = null;
  let publicProductPhotoEvidenceId: string | null = null;
  let labelPhotoEvidenceId: string | null = null;
  try {
    const resolvedKnown = await resolveKnownCatalogProduct(supabase, existingProductId, brandName, styleNumber, identifier, productUrl);
    const resolvedIdentityMatchesSubmitted = !resolvedKnown || Boolean(existingProductId) || !identifier || (
      normalizeSearchText(brandName) === resolvedKnown.brand.normalized_name
      && normalizeSearchText(productName) === normalizeSearchText(resolvedKnown.product.name)
    );
    const known = identityUncertain || !resolvedIdentityMatchesSubmitted ? null : resolvedKnown;
    const normalizedSizeId = await getNormalizedSize(supabase, structuredSizeLabel, sizeKind, sizingSystem);

    if (known) {
      const product = known.product;
      const canonicalBrand = known.brand;
      const typeAgrees = !product.garment_type_key || product.garment_type_key === garmentType;

      if (!typeAgrees) {
        const { error: closetError } = await supabase.from("closet_items").insert({ id: newClosetItemId, user_id: userId, product_id: null, variant_id: null, size_label: structuredSizeLabel, normalized_size_id: normalizedSizeId, visibility: "shared", wears_count: 0 });
        if (closetError) throw closetError;

        const { data: report, error: reportError } = await supabase.from("fit_reports").insert({
          user_id: userId,
          closet_item_id: newClosetItemId,
          product_id: null,
          variant_id: null,
          fit_profile_version_id: fitProfileVersionId,
          size_label: structuredSizeLabel,
          normalized_size_id: normalizedSizeId,
          fit,
          garment_condition: garmentCondition,
          reported_condition: reportedCondition,
          fit_notes: fitNotes,
          would_buy_again: null,
          garment_type_key: garmentType,
          garment_answers: answerSnapshot,
          objective_variant_key: variantFingerprint,
        }).select("id").single();
        if (reportError || !report) throw reportError ?? new Error("Could not save disputed Fit Report");

        await savePurchaseContext(supabase, userId, report.id, purchaseContext);
        if (photoFront) fitPhotoPaths.push(await saveFitPhoto(supabase, userId, newClosetItemId, photoFront, "front", frontPhotoQuality));
        if (photoBack) fitPhotoPaths.push(await saveFitPhoto(supabase, userId, newClosetItemId, photoBack, "back", backPhotoQuality));

        let productPhotoPath: string | null = null;
        let productLabelPhotoPath: string | null = null;
        if (productPhoto) { productPhotoPath = await uploadPrivateCatalogPhoto(supabase, userId, newClosetItemId, productPhoto, "product"); catalogPhotoPaths.push(productPhotoPath); }
        if (productLabelPhoto) { productLabelPhotoPath = await uploadPrivateCatalogPhoto(supabase, userId, newClosetItemId, productLabelPhoto, "label"); catalogPhotoPaths.push(productLabelPhotoPath); }

        const normalizedIdentifier = identifier ? normalizeIdentifier(identifier) : "";
        const identifierKind = identifier ? (/^\d{8}$|^\d{12,14}$/.test(normalizedIdentifier) ? "upc" : "barcode") : null;
        const { data: candidateId, error: pendingError } = await supabase.rpc("record_pending_garment_submission", {
          p_closet_item_id: newClosetItemId,
          p_fit_report_id: report.id,
          p_brand_text: brandName,
          p_model_text: productName,
          p_garment_type_key: garmentType,
          p_color_family_key: colorFamily,
          p_normalized_size_id: normalizedSizeId,
          p_size_label: structuredSizeLabel,
          p_identifier_type: identifierKind,
          p_identifier_value: identifier || null,
          p_style_number: styleNumber,
          p_retailer_url: productUrl || null,
          p_normalized_retailer_url: normalizedProductUrl,
          p_department_key: department,
          p_attributes: attributeClaims,
          p_materials: materialClaims,
          p_product_photo_storage_path: productPhotoPath,
          p_product_label_photo_storage_path: productLabelPhotoPath,
          p_identity_uncertain: false,
        });
        if (pendingError || !candidateId) throw pendingError ?? new Error("Could not save disputed garment evidence");

        const { error: flagError } = await supabase.rpc("flag_known_product_garment_type_conflict", {
          p_candidate_id: String(candidateId),
          p_product_id: product.id,
          p_fit_report_id: report.id,
          p_submitted_garment_type: garmentType,
        });
        if (flagError) throw flagError;
      } else {
        const variantId = await getOrCreateVariant(supabase, product.id, normalizedSizeId, structuredSizeLabel, colorFamily, product.market_segment);
        const { data: savedRows, error: saveError } = await supabase.rpc("save_known_fit_report", {
          p_new_closet_item_id: newClosetItemId,
          p_product_id: product.id,
          p_variant_id: variantId,
          p_fit_profile_version_id: fitProfileVersionId,
          p_size_label: structuredSizeLabel,
          p_normalized_size_id: normalizedSizeId,
          p_fit: fit,
          p_garment_condition: garmentCondition,
          p_reported_condition: reportedCondition,
          p_fit_notes: fitNotes,
          p_garment_type_key: garmentType,
          p_garment_answers: answerSnapshot,
          p_objective_variant_key: variantFingerprint,
        });
        const saved = (Array.isArray(savedRows) ? savedRows[0] : savedRows) as KnownFitSaveRow | null;
        if (saveError || !saved?.fit_report_id || !saved.closet_item_id) throw saveError ?? new Error("Could not save Fit Report");
        savedClosetItemId = saved.closet_item_id;
        updatedExisting = !saved.created;

        await savePurchaseContext(supabase, userId, saved.fit_report_id, purchaseContext);
        if (identifier) {
          const { error: barcodeEvidenceError } = await supabase.rpc("record_product_barcode_evidence", {
            p_product_id: product.id,
            p_fit_report_id: saved.fit_report_id,
            p_barcode: identifier,
          });
          if (barcodeEvidenceError) throw barcodeEvidenceError;
        }
        if (styleNumber) await recordIdentifier(supabase, product.id, variantId, styleNumber, "manufacturer_style");
        if (productUrl) await recordListing(supabase, product.id, variantId, productUrl);

        const sourceReference = productUrl || identifier || styleNumber || `fit_report:${saved.fit_report_id}`;
        const { error: evidenceError } = await supabase.rpc("record_member_product_evidence", {
          p_product_id: product.id,
          p_fit_report_id: saved.fit_report_id,
          p_garment_type: garmentType,
          p_market_segment: product.market_segment,
          p_attributes: attributeClaims,
          p_materials: materialClaims,
          p_department: department,
          p_source_reference: sourceReference,
        });
        if (evidenceError) throw evidenceError;

        if (existingProductId) {
          if (normalizeSearchText(brandName) !== canonicalBrand.normalized_name) {
            const { error } = await supabase.rpc("record_member_product_identity_issue", { p_product_id: product.id, p_field_key: "brand_name", p_value: brandName });
            if (error) throw error;
          }
          if (normalizeSearchText(productName) !== normalizeSearchText(product.name)) {
            const { error } = await supabase.rpc("record_member_product_identity_issue", { p_product_id: product.id, p_field_key: "item_name", p_value: productName });
            if (error) throw error;
          }
        }
        if (styleIssue) {
          const { error } = await supabase.rpc("record_member_product_identity_issue", { p_product_id: product.id, p_field_key: "manufacturer_style", p_value: styleIssue });
          if (error) throw error;
        } else if (styleNumber && !product.manufacturer_style_number) {
          const { error } = await supabase.rpc("record_member_product_identity_issue", { p_product_id: product.id, p_field_key: "manufacturer_style", p_value: styleNumber });
          if (error) throw error;
        }
        if (barcodeIssue) {
          const { error } = await supabase.rpc("record_product_barcode_evidence", {
            p_product_id: product.id,
            p_fit_report_id: saved.fit_report_id,
            p_barcode: barcodeIssue,
          });
          if (error) throw error;
        }

        if (photoFront) fitPhotoPaths.push(await saveFitPhoto(supabase, userId, savedClosetItemId, photoFront, "front", frontPhotoQuality));
        if (photoBack) fitPhotoPaths.push(await saveFitPhoto(supabase, userId, savedClosetItemId, photoBack, "back", backPhotoQuality));

        if (productPhoto) {
          const extension = PHOTO_TYPES[productPhoto.type];
          publicProductPhotoPath = `${userId}/${product.id}/${randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from("product-photos").upload(publicProductPhotoPath, await productPhoto.arrayBuffer(), { contentType: productPhoto.type, upsert: false });
          if (uploadError) throw uploadError;
          const publicUrl = supabase.storage.from("product-photos").getPublicUrl(publicProductPhotoPath).data.publicUrl;
          const { data: productPhotoEvidence, error: productPhotoEvidenceError } = await supabase.from("product_photo_evidence").insert({ product_id: product.id, storage_path: publicProductPhotoPath, public_url: publicUrl, submitted_by: userId }).select("id").single();
          if (productPhotoEvidenceError) throw productPhotoEvidenceError;
          publicProductPhotoEvidenceId = productPhotoEvidence.id as string;
        }
        if (productLabelPhoto) {
          const labelEvidence = await saveKnownProductLabelPhoto(supabase, userId, product.id, saved.fit_report_id, productLabelPhoto);
          catalogPhotoPaths.push(labelEvidence.path);
          labelPhotoEvidenceId = labelEvidence.evidenceId;
        }
      }
    } else {
      const { error: closetError } = await supabase.from("closet_items").insert({ id: newClosetItemId, user_id: userId, product_id: null, variant_id: null, size_label: structuredSizeLabel, normalized_size_id: normalizedSizeId, visibility: "shared", wears_count: 0 });
      if (closetError) throw closetError;

      const { data: report, error: reportError } = await supabase.from("fit_reports").insert({
        user_id: userId,
        closet_item_id: newClosetItemId,
        product_id: null,
        variant_id: null,
        fit_profile_version_id: fitProfileVersionId,
        size_label: structuredSizeLabel,
        normalized_size_id: normalizedSizeId,
        fit,
        garment_condition: garmentCondition,
        reported_condition: reportedCondition,
        fit_notes: fitNotes,
        would_buy_again: null,
        garment_type_key: garmentType,
        garment_answers: answerSnapshot,
        objective_variant_key: variantFingerprint,
      }).select("id").single();
      if (reportError || !report) throw reportError ?? new Error("Could not save pending fit report");

      await savePurchaseContext(supabase, userId, report.id, purchaseContext);
      if (photoFront) fitPhotoPaths.push(await saveFitPhoto(supabase, userId, newClosetItemId, photoFront, "front", frontPhotoQuality));
      if (photoBack) fitPhotoPaths.push(await saveFitPhoto(supabase, userId, newClosetItemId, photoBack, "back", backPhotoQuality));

      let productPhotoPath: string | null = null;
      let productLabelPhotoPath: string | null = null;
      if (productPhoto) { productPhotoPath = await uploadPrivateCatalogPhoto(supabase, userId, newClosetItemId, productPhoto, "product"); catalogPhotoPaths.push(productPhotoPath); }
      if (productLabelPhoto) { productLabelPhotoPath = await uploadPrivateCatalogPhoto(supabase, userId, newClosetItemId, productLabelPhoto, "label"); catalogPhotoPaths.push(productLabelPhotoPath); }

      const normalizedIdentifier = identifier ? normalizeIdentifier(identifier) : "";
      const identifierKind = identifier ? (/^\d{8}$|^\d{12,14}$/.test(normalizedIdentifier) ? "upc" : "barcode") : null;
      const { error: pendingError } = await supabase.rpc("record_pending_garment_submission", {
        p_closet_item_id: newClosetItemId,
        p_fit_report_id: report.id,
        p_brand_text: brandName,
        p_model_text: productName,
        p_garment_type_key: garmentType,
        p_color_family_key: colorFamily,
        p_normalized_size_id: normalizedSizeId,
        p_size_label: structuredSizeLabel,
        p_identifier_type: identifierKind,
        p_identifier_value: identifier || null,
        p_style_number: styleNumber,
        p_retailer_url: productUrl || null,
        p_normalized_retailer_url: normalizedProductUrl,
        p_department_key: department,
        p_attributes: attributeClaims,
        p_materials: materialClaims,
        p_product_photo_storage_path: productPhotoPath,
        p_product_label_photo_storage_path: productLabelPhotoPath,
        p_identity_uncertain: identityUncertain,
      });
      if (pendingError) throw pendingError;
    }
  } catch {
    if (!updatedExisting && fitPhotoPaths.length) await supabase.storage.from("fit-reference-photos").remove(fitPhotoPaths);
    if (labelPhotoEvidenceId) await supabase.from("product_label_photo_evidence").delete().eq("id", labelPhotoEvidenceId).eq("submitted_by", userId);
    if (catalogPhotoPaths.length) await supabase.storage.from("catalog-submission-photos").remove(catalogPhotoPaths);
    if (publicProductPhotoEvidenceId) await supabase.from("product_photo_evidence").delete().eq("id", publicProductPhotoEvidenceId).eq("submitted_by", userId);
    if (publicProductPhotoPath) await supabase.storage.from("product-photos").remove([publicProductPhotoPath]);
    if (!updatedExisting) await supabase.from("closet_items").delete().eq("id", newClosetItemId).eq("user_id", userId);
    fail("save_failed");
  }

  redirect(`/closet/add?${updatedExisting ? "updated" : "added"}=${encodeURIComponent(savedClosetItemId)}`);
}
