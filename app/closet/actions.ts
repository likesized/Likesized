"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { COLOR_FAMILIES, GARMENT_TYPE_BY_KEY, isAllowedGarmentAnswer } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";
import type { GarmentMarketSegment, GarmentSizeKind } from "@/lib/domain";

const FIT_RESULTS = new Set(["too_small", "snug", "just_right", "relaxed", "too_big"]);
const REPORTED_CONDITIONS = new Set(["new", "used", "altered"]);
const CATALOG_CONFIRMATIONS = new Set(["confirm", "change", "unsure"]);
const COLOR_FAMILY_KEYS = new Set(COLOR_FAMILIES.map((item) => item.value));
const SIZE_KINDS = new Set(["alpha", "numeric", "waist_inseam", "dress_shirt", "jacket", "bra", "shoe", "length_designation", "freeform"]);
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const TRACKING_PARAMS = new Set(["fbclid", "gclid", "dclid", "mc_cid", "mc_eid", "msclkid"]);
const PRODUCT_ATTRIBUTE_PREFIX="product_attribute__";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXTERNAL_CATALOG_PROVIDERS = new Set(["channel3_catalog", "upcitemdb"]);

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type BrandRecord = { id: string; name: string; slug: string; normalized_name: string };
type ProductFamilyRecord = { id:string; brand_id:string; name:string; normalized_name:string; garment_type_key:string; market_segment:GarmentMarketSegment };
type ProductRecord = { id: string; name: string; slug: string; category: string; garment_type_key: string | null; market_segment: GarmentMarketSegment; product_family_id?:string|null; brand_id?:string; manufacturer_style_number?:string|null; manufacturer_style_normalized?:string|null };
type ParsedSize = Record<string, string | number | null> & { kind: GarmentSizeKind; normalized_key: string; display_label: string };

function fail(code: string): never { redirect(`/closet/add?error=${encodeURIComponent(code)}`); }
function text(formData: FormData, name: string) { return String(formData.get(name) ?? "").trim(); }
function normalizeSearchText(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function normalizeIdentifier(value: string) { return value.trim().toUpperCase().replace(/[\s_.-]+/g, ""); }
function slugify(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "item"; }
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
function externalCatalogRecord(raw: string) {
  if (!raw || raw.length > 520_000) return null;
  try {
    const value = JSON.parse(raw) as { externalProductId?: unknown; sourceRecord?: unknown; imageUrl?: unknown };
    if (typeof value.externalProductId !== "string" || !value.externalProductId.trim() || value.externalProductId.length > 200 || !value.sourceRecord || typeof value.sourceRecord !== "object" || Array.isArray(value.sourceRecord)) return null;
    if (JSON.stringify(value.sourceRecord).length > 512_000) return null;
    return { externalProductId: value.externalProductId.trim(), sourceRecord: value.sourceRecord, imageUrl: typeof value.imageUrl === "string" && value.imageUrl.length <= 1000 ? value.imageUrl : null };
  } catch { return null; }
}

async function findBrand(supabase: SupabaseClient, name: string) {
  const normalized = normalizeSearchText(name);
  const { data: direct, error } = await supabase.from("brands").select("id,name,slug,normalized_name").eq("normalized_name", normalized).maybeSingle();
  if (error) throw error;
  if (direct) return direct as BrandRecord;
  const { data: alias, error: aliasError } = await supabase.from("brand_aliases").select("brand:brands(id,name,slug,normalized_name)").eq("normalized_alias", normalized).maybeSingle();
  if (aliasError) throw aliasError;
  const joined = alias?.brand;
  return (Array.isArray(joined) ? joined[0] : joined) as BrandRecord | null;
}

async function getOrCreateBrand(supabase: SupabaseClient, name: string) {
  const existing = await findBrand(supabase, name);
  if (existing) return existing;
  const baseSlug = slugify(name);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase.from("brands").insert({ name, slug, normalized_name: normalizeSearchText(name) }).select("id,name,slug,normalized_name").single();
    if (!error) return data as BrandRecord;
    if (error.code === "23505") { const raced = await findBrand(supabase, name); if (raced) return raced; continue; }
    throw error;
  }
  throw new Error("Could not resolve brand");
}

async function getGarmentType(supabase: SupabaseClient, key: string) {
  const { data, error } = await supabase.from("garment_types").select("key,category").eq("key", key).eq("active", true).maybeSingle();
  if (error || !data) throw error ?? new Error("Unknown garment type");
  return data as { key: string; category: string };
}

async function getCatalogProductById(supabase:SupabaseClient,id:string){
  const {data:product,error}=await supabase.from("products").select("id,name,slug,category,garment_type_key,market_segment,product_family_id,brand_id,manufacturer_style_number,manufacturer_style_normalized").eq("id",id).maybeSingle();
  if(error||!product)throw error??new Error("Unknown catalog product");
  const {data:brand,error:brandError}=await supabase.from("brands").select("id,name,slug,normalized_name").eq("id",product.brand_id).maybeSingle();
  if(brandError||!brand)throw brandError??new Error("Unknown product brand");
  return {brand:brand as BrandRecord,product:product as ProductRecord};
}

async function findProduct(supabase: SupabaseClient, brandId: string, name: string, styleNumber: string | null) {
  let query = supabase.from("products").select("id,name,slug,category,garment_type_key,market_segment,product_family_id,brand_id,manufacturer_style_number,manufacturer_style_normalized").eq("brand_id", brandId).eq("normalized_name", normalizeSearchText(name));
  query = styleNumber ? query.eq("manufacturer_style_normalized", normalizeIdentifier(styleNumber)) : query.is("manufacturer_style_normalized", null);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data as ProductRecord | null;
}

async function getRequestedProductFamily(supabase:SupabaseClient,id:string,brandId:string,garmentType:string,marketSegment:GarmentMarketSegment){
  const {data,error}=await supabase.from("product_families").select("id,brand_id,name,normalized_name,garment_type_key,market_segment").eq("id",id).maybeSingle();
  if(error||!data)throw error??new Error("Unknown Product Fit Family");
  const family=data as ProductFamilyRecord;
  if(family.brand_id!==brandId||family.garment_type_key!==garmentType||family.market_segment!==marketSegment)throw new Error("Product Fit Family does not match product identity");
  return family;
}

async function findProductFamily(supabase:SupabaseClient,brandId:string,name:string,garmentType:string,marketSegment:GarmentMarketSegment){
  const {data,error}=await supabase.from("product_families").select("id,brand_id,name,normalized_name,garment_type_key,market_segment").eq("brand_id",brandId).eq("normalized_name",normalizeSearchText(name)).eq("garment_type_key",garmentType).eq("market_segment",marketSegment).maybeSingle();
  if(error)throw error;
  return data as ProductFamilyRecord|null;
}

async function getOrCreateProductFamily(supabase:SupabaseClient,brand:BrandRecord,productName:string,garmentType:string,marketSegment:GarmentMarketSegment,styleNumber:string|null,requestedFamilyId:string|null){
  if(requestedFamilyId)return getRequestedProductFamily(supabase,requestedFamilyId,brand.id,garmentType,marketSegment);
  const familyName=styleNumber?`${productName} · Style ${styleNumber}`:productName;
  const existing=await findProductFamily(supabase,brand.id,familyName,garmentType,marketSegment);
  if(existing)return existing;
  const row={brand_id:brand.id,name:familyName,normalized_name:normalizeSearchText(familyName),garment_type_key:garmentType,market_segment:marketSegment};
  const {data,error}=await supabase.from("product_families").insert(row).select("id,brand_id,name,normalized_name,garment_type_key,market_segment").single();
  if(!error)return data as ProductFamilyRecord;
  if(error.code==="23505"){
    const raced=await findProductFamily(supabase,brand.id,familyName,garmentType,marketSegment);
    if(raced)return raced;
  }
  throw error;
}

async function getOrCreateProduct(supabase: SupabaseClient, brand: BrandRecord, name: string, garmentType: string, category: string, marketSegment: GarmentMarketSegment, styleNumber: string | null, requestedFamilyId:string|null) {
  const existing = await findProduct(supabase, brand.id, name, styleNumber);
  if (existing) return {product:existing,created:false};
  const family=await getOrCreateProductFamily(supabase,brand,name,garmentType,marketSegment,styleNumber,requestedFamilyId);
  const baseSlug = `${brand.slug}-${slugify(name)}-${marketSegment}`.slice(0, 140);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase.from("products").insert({ brand_id: brand.id, name, normalized_name: normalizeSearchText(name), slug, category, product_family_id:family.id, garment_type_key: garmentType, market_segment: marketSegment, manufacturer_style_number: styleNumber, manufacturer_style_normalized: styleNumber ? normalizeIdentifier(styleNumber) : null, catalog_status:"provisional" }).select("id,name,slug,category,garment_type_key,market_segment,product_family_id,brand_id,manufacturer_style_number,manufacturer_style_normalized").single();
    if (!error) return {product:data as ProductRecord,created:true};
    if (error.code === "23505") { const raced = await findProduct(supabase, brand.id, name, styleNumber); if (raced) return {product:raced,created:false}; continue; }
    throw error;
  }
  throw new Error("Could not resolve product");
}

async function getExactCatalogProduct(supabase:SupabaseClient,id:string,brandName:string,productName:string,styleNumber:string|null){
  const exact=await getCatalogProductById(supabase,id);
  const submittedStyle=styleNumber?normalizeIdentifier(styleNumber):null;
  const canonicalStyle=exact.product.manufacturer_style_normalized??null;
  if(normalizeSearchText(brandName)!==exact.brand.normalized_name||normalizeSearchText(productName)!==normalizeSearchText(exact.product.name)||submittedStyle!==canonicalStyle)throw new Error("Exact catalog identity changed");
  return exact;
}

async function resolveKnownCatalogProduct(supabase:SupabaseClient,existingProductId:string|null,brandName:string,productName:string,garmentType:string,marketSegment:GarmentMarketSegment,styleNumber:string|null,identifier:string,productUrl:string){
  if(existingProductId)return getExactCatalogProduct(supabase,existingProductId,brandName,productName,styleNumber);
  const normalizedUrl=productUrl?normalizeProductUrl(productUrl):null;
  const {data:resolvedId,error}=await supabase.rpc("resolve_catalog_product",{p_existing_product_id:null,p_brand_name:brandName,p_style_number:styleNumber,p_identifier:identifier||null,p_normalized_url:normalizedUrl});
  if(error)throw error;
  if(!resolvedId)return null;
  return getCatalogProductById(supabase,String(resolvedId));
}

async function getNormalizedSize(supabase: SupabaseClient, structuredLabel: string, kind: GarmentSizeKind, sizingSystem: string | null) {
  const { data: parsedData, error: parseError } = await supabase.rpc("parse_garment_size", { p_label: structuredLabel, p_kind: kind, p_system: sizingSystem });
  if (parseError || !parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) throw parseError ?? new Error("Could not parse size");
  const parsed = parsedData as ParsedSize;
  const { data: existing, error } = await supabase.from("normalized_sizes").select("id").eq("normalized_key", parsed.normalized_key).maybeSingle();
  if (error) throw error;
  if (existing) return existing.id as string;
  const allowed = ["kind","normalized_key","display_label","sizing_system","alpha_size","numeric_size","waist_size","inseam_size","length_designation","collar_size","sleeve_min","sleeve_max","jacket_chest_size","bra_band","bra_cup","shoe_size","freeform_normalized"];
  const row = Object.fromEntries(allowed.filter((key) => parsed[key] !== undefined).map((key) => [key, parsed[key]]));
  const { data, error: insertError } = await supabase.from("normalized_sizes").insert(row).select("id").single();
  if (!insertError) return data.id as string;
  if (insertError.code === "23505") { const { data: raced } = await supabase.from("normalized_sizes").select("id").eq("normalized_key", parsed.normalized_key).single(); return raced!.id as string; }
  throw insertError;
}

async function getOrCreateVariant(supabase: SupabaseClient, productId: string, normalizedSizeId: string, originalSizeLabel: string, colorFamily: string, marketSegment: GarmentMarketSegment, sku: string | null) {
  const colorLabel = COLOR_FAMILIES.find((item) => item.value === colorFamily)?.label ?? colorFamily;
  const colorNormalized = normalizeSearchText(colorLabel);
  const { data: existing, error } = await supabase.from("product_variants").select("id").eq("product_id", productId).eq("normalized_size_id", normalizedSizeId).eq("color_family_key", colorFamily).maybeSingle();
  if (error) throw error;
  if (existing) return existing.id as string;
  const { data, error: insertError } = await supabase.from("product_variants").insert({ product_id: productId, normalized_size_id: normalizedSizeId, size_label: originalSizeLabel, color_label: colorLabel, color_normalized: colorNormalized, color_family_key: colorFamily, market_segment: marketSegment, sku }).select("id").single();
  if (!insertError) return data.id as string;
  if (insertError.code === "23505") { const { data: raced } = await supabase.from("product_variants").select("id").eq("product_id", productId).eq("normalized_size_id", normalizedSizeId).eq("color_family_key", colorFamily).single(); return raced!.id as string; }
  throw insertError;
}

async function recordIdentifier(supabase: SupabaseClient, productId: string, variantId: string, original: string, kind: "manufacturer_style" | "sku" | "upc" | "barcode") {
  if (!original) return;
  const { error } = await supabase.from("product_identifiers").insert({ product_id: productId, variant_id: variantId, identifier_type: kind, original_value: original, normalized_value: normalizeIdentifier(original) });
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
  if (existing) return;
  const { error } = await supabase.from("retailer_listings").insert({ product_id: productId, variant_id: variantId, retailer_id: retailer?.id ?? null, product_url: rawUrl, normalized_url: normalizedUrl });
  if (error && error.code !== "23505") throw error;
}

async function validatedProductAttributes(supabase:SupabaseClient,formData:FormData,garmentType:string){
  const submitted=[...formData.entries()].filter(([name,value])=>name.startsWith(PRODUCT_ATTRIBUTE_PREFIX)&&typeof value==="string"&&value.trim()).map(([name,value])=>({attribute_key:name.slice(PRODUCT_ATTRIBUTE_PREFIX.length),option_key:String(value).trim()}));
  if(!submitted.length)return [];
  if(submitted.some((row)=>!row.attribute_key||row.attribute_key.length>80||!row.option_key||row.option_key.length>80||!isAllowedGarmentAnswer(garmentType,row.attribute_key,row.option_key))||new Set(submitted.map((row)=>row.attribute_key)).size!==submitted.length)throw new Error("Invalid product attributes");
  const keys=submitted.map((row)=>row.attribute_key);
  const {data:definitions,error:definitionError}=await supabase.from("garment_attribute_definitions").select("key").in("key",keys);
  if(definitionError)throw definitionError;
  if(new Set((definitions??[]).map((row)=>row.key)).size!==keys.length)throw new Error("Unknown product attribute");
  const {data:options,error:optionError}=await supabase.from("garment_attribute_options").select("attribute_key,option_key").in("attribute_key",keys);
  if(optionError)throw optionError;
  const allowed=new Set((options??[]).map((row)=>`${row.attribute_key}:${row.option_key}`));
  if(submitted.some((row)=>!allowed.has(`${row.attribute_key}:${row.option_key}`)))throw new Error("Invalid product attribute option");
  return submitted;
}

export async function addGarment(formData: FormData) {
  const brandName = text(formData, "brand");
  const productName = text(formData, "product");
  const existingProductId=text(formData,"existing_product_id")||null;
  const requestedFamilyId=null;
  const garmentType = text(formData, "garment_type");
  const marketSegment = "unknown" as GarmentMarketSegment;
  const catalogConfirmation=text(formData,"catalog_confirmation");
  const sizeKind = text(formData, "size_kind") as GarmentSizeKind;
  const structuredSizeLabel = text(formData, "size_normalized_label");
  const originalSizeLabel = text(formData, "original_size_label") || structuredSizeLabel;
  const sizingSystem = text(formData, "sizing_system") || null;
  const styleNumber = text(formData, "style_number") || null;
  const identifier = text(formData, "identifier");
  const productUrl = text(formData, "product_url");
  const catalogSourceUrl = text(formData, "catalog_source_url");
  const catalogSourceProvider = text(formData, "catalog_source_provider");
  const catalogSourceRecord = externalCatalogRecord(text(formData, "catalog_source_record"));
  const colorFamily = text(formData, "color_family");
  const visibility = "shared" as const;
  const fit = text(formData, "fit");
  const reportedCondition = text(formData, "reported_condition");
  const garmentCondition = reportedCondition === "altered" ? "altered" : "normal";
  const fitNotes = text(formData, "fit_notes") || null;
  const wearsCount = 0;

  if (!brandName || brandName.length > 120 || !productName || productName.length > 180 || (existingProductId&&!UUID.test(existingProductId)) || !GARMENT_TYPE_BY_KEY.has(garmentType) || (existingProductId&&!CATALOG_CONFIRMATIONS.has(catalogConfirmation)) || !SIZE_KINDS.has(sizeKind) || !structuredSizeLabel || structuredSizeLabel.length > 60 || !originalSizeLabel || originalSizeLabel.length > 60 || (sizingSystem && sizingSystem.length > 20) || !COLOR_FAMILY_KEYS.has(colorFamily) || !FIT_RESULTS.has(fit) || !REPORTED_CONDITIONS.has(reportedCondition) || (fitNotes && fitNotes.length > 1000) || (productUrl && productUrl.length > 1000) || (catalogSourceUrl && catalogSourceUrl.length > 1000) || (catalogSourceProvider && !EXTERNAL_CATALOG_PROVIDERS.has(catalogSourceProvider)) || (catalogSourceRecord && !catalogSourceProvider) || identifier.length>120 || (styleNumber&&styleNumber.length>100)) fail("invalid_fields");
  if (productUrl) { try { normalizeProductUrl(productUrl); } catch { fail("invalid_fields"); } }
  if (catalogSourceUrl) { try { normalizeProductUrl(catalogSourceUrl); } catch { fail("invalid_fields"); } }

  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;
  if (photo && (!PHOTO_TYPES[photo.type] || photo.size > 8 * 1024 * 1024)) fail("invalid_photo");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/closet/add");

  const [{ data: profile }, { data: fitProfile }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile?.username || !fitProfile?.completed_at) redirect("/onboarding");

  const { data: fitProfileVersionId, error: versionError } = await supabase.rpc("commit_fit_profile_version");
  if (versionError || !fitProfileVersionId) fail("save_failed");

  const closetItemId = randomUUID();
  let photoPath: string | null = null;
  try {
    const submittedType = await getGarmentType(supabase, garmentType);
    const resolvedUrl=productUrl||catalogSourceUrl;
    const known=await resolveKnownCatalogProduct(supabase,existingProductId,brandName,productName,garmentType,marketSegment,styleNumber,identifier,resolvedUrl);
    let product:ProductRecord;
    if(known){
      product=known.product;
    }else{
      const brand=await getOrCreateBrand(supabase, brandName);
      const resolved=await getOrCreateProduct(supabase, brand, productName, garmentType, submittedType.category, marketSegment, styleNumber,requestedFamilyId);
      product=resolved.product;
    }

    const canonicalType=product.garment_type_key;
    const classificationsAgree=canonicalType===garmentType&&product.category===submittedType.category;
    let attributeRows=classificationsAgree?await validatedProductAttributes(supabase,formData,garmentType):[];
    if(existingProductId&&catalogConfirmation==="confirm"){
      const {data:currentAttributes,error:currentAttributeError}=await supabase.from("product_attribute_values").select("attribute_key,option_key").eq("product_id",product.id).neq("source_status","rejected");
      if(currentAttributeError)throw currentAttributeError;
      attributeRows=(currentAttributes??[]).filter((row)=>isAllowedGarmentAnswer(garmentType,row.attribute_key,row.option_key));
    }
    const sourceReference=catalogSourceUrl ? `${catalogSourceProvider}:${catalogSourceUrl}` : productUrl||identifier||styleNumber||"closet_log";

    const normalizedSizeId = await getNormalizedSize(supabase, structuredSizeLabel, sizeKind, sizingSystem);
    const identifierKind = identifier && /^\d{8}$|^\d{12,14}$/.test(normalizeIdentifier(identifier)) ? "upc" : "sku";
    const variantId = await getOrCreateVariant(supabase, product.id, normalizedSizeId, originalSizeLabel, colorFamily, product.market_segment, identifierKind === "sku" ? identifier || null : null);

    const { error: closetError } = await supabase.from("closet_items").insert({ id: closetItemId, user_id: userId, product_id: product.id, variant_id: variantId, size_label: originalSizeLabel, normalized_size_id: normalizedSizeId, visibility, wears_count: wearsCount });
    if (closetError) throw closetError;

    const { data: report, error: reportError } = await supabase.from("fit_reports").insert({ user_id: userId, closet_item_id: closetItemId, product_id: product.id, variant_id: variantId, fit_profile_version_id: fitProfileVersionId, size_label: originalSizeLabel, normalized_size_id: normalizedSizeId, fit, garment_condition:garmentCondition, reported_condition:reportedCondition, fit_notes: fitNotes, would_buy_again: null }).select("id").single();
    if (reportError || !report) throw reportError ?? new Error("Could not save fit report");
    if (styleNumber) await recordIdentifier(supabase, product.id, variantId, styleNumber, "manufacturer_style");
    if (identifier) await recordIdentifier(supabase, product.id, variantId, identifier, identifierKind);
    if (resolvedUrl) await recordListing(supabase, product.id, variantId, resolvedUrl);

    if (photo) {
      const extension = PHOTO_TYPES[photo.type];
      photoPath = `${userId}/${closetItemId}/fit.${extension}`;
      const { error: uploadError } = await supabase.storage.from("fit-reference-photos").upload(photoPath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: metadataError } = await supabase.from("fit_reference_photos").insert({ user_id: userId, closet_item_id: closetItemId, storage_path: photoPath });
      if (metadataError) throw metadataError;
    }

    if(!existingProductId||catalogConfirmation!=="unsure"){
      const {error:evidenceError}=await supabase.rpc("record_member_product_evidence",{p_product_id:product.id,p_garment_type:garmentType,p_market_segment:product.market_segment,p_attributes:attributeRows,p_materials:[],p_source_reference:sourceReference});
      if(evidenceError)throw evidenceError;
    }
    if (catalogSourceRecord && catalogSourceProvider) {
      const { error: sourceError } = await supabase.rpc("record_catalog_source_selection", {
        p_product_id: product.id, p_provider_key: catalogSourceProvider,
        p_external_product_id: catalogSourceRecord.externalProductId, p_source_url: catalogSourceUrl || null,
        p_image_url: catalogSourceRecord.imageUrl, p_source_payload: catalogSourceRecord.sourceRecord,
      });
      if (sourceError) throw sourceError;
    }
  } catch {
    if (photoPath) await supabase.storage.from("fit-reference-photos").remove([photoPath]);
    await supabase.from("closet_items").delete().eq("id", closetItemId).eq("user_id", userId);
    fail("save_failed");
  }

  redirect("/closet?added=1");
}
